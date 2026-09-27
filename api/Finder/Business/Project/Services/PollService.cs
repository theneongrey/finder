using Finder.Business.Auth.Entities;
using Finder.Business.Permission.Entities;
using Finder.Business.Project.Api.Requests;
using Finder.Business.Project.Entities;
using Finder.Business.Project.RealTime;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Project.Services;

public class PollService
{
    private readonly AppDbContext _dbContext;
    private readonly UserService _userService;
    private readonly ProjectNotificationService _projectNotificationService;
    private readonly PollUpdateNotificationQueue _pollUpdateQueue;
    private readonly IPollChangeNotifier _pollChangeNotifier;

    private Guid? UserId => _userService.GetUserId();

    // Rows committed within this window of the client's token are re-sent even if the token is
    // technically newer, so nothing is missed at the boundary. The client upserts by id, so a
    // re-delivered row is harmless.
    private static readonly TimeSpan DeltaOverlap = TimeSpan.FromSeconds(2);

    public PollService(AppDbContext dbContext, UserService userService,
        ProjectNotificationService projectNotificationService, PollUpdateNotificationQueue pollUpdateQueue,
        IPollChangeNotifier pollChangeNotifier)
    {
        _dbContext = dbContext;
        _userService = userService;
        _projectNotificationService = projectNotificationService;
        _pollUpdateQueue = pollUpdateQueue;
        _pollChangeNotifier = pollChangeNotifier;
    }

    public async Task<Result<Poll>> AddPoll(AddPollRequest pollRequest)
    {
        var projectResult = await _dbContext.Projects
            .Include(p => p.Polls)
            .Where(p => p.Id == SlugHelper.ExtractId(pollRequest.ProjectId) && (p.Creator.Id == UserId ||
                p.Permissions.Any(permission =>
                    permission.Person.Id == UserId &&
                    permission.PermissionType >= PermissionType.Maintainer)))
            .SingleOrDefaultAsync();

        if (projectResult == null)
        {
            return Result<Poll>.Fail(404);
        }

        var poll = new Poll
        {
            Id = SlugHelper.GenerateId(),
            OptionType = pollRequest.OptionType,
            Name = pollRequest.Name.StripHtml(),
            Description = pollRequest.Description.StripHtml(),
            Project = projectResult,
            CloseDate = pollRequest.CloseDate.HasValue
                ? DateTime.SpecifyKind(pollRequest.CloseDate.Value, DateTimeKind.Utc)
                : null
        };

        _dbContext.Polls.Add(poll);

        await _dbContext.SaveChangesAsync();
        return Result<Poll>.Success(poll);
    }

    public async Task<Result<Poll>> UpdatePoll(string slug, string name, string description, DateTime? closeDate = null, OptionType? optionType = null)
    {
        var poll = await _dbContext.Polls
            .IncludeProjectMembers()
            .Include(t => t.Options)
            .ThenInclude(o => o.Votes)
            .ThenInclude(v => v.Person)
            .WhereMaintainableBy(slug, UserId)
            .SingleOrDefaultAsync();

        if (poll is null)
        {
            return Result<Poll>.Fail(404);
        }

        if (poll.CloseDate.HasValue && poll.CloseDate <= DateTime.UtcNow)
        {
            return Result<Poll>.Fail(409);
        }

        var oldName = poll.Name;
        var oldDescription = poll.Description;

        poll.Name = name.StripHtml();
        poll.Description = description.StripHtml();
        poll.CloseDate = closeDate.HasValue ? DateTime.SpecifyKind(closeDate.Value, DateTimeKind.Utc) : null;
        if (optionType.HasValue)
        {
            poll.OptionType = optionType.Value;
        }

        if (poll.Project.IsStandalone)
        {
            poll.Project.Name = name.StripHtml();
        }

        await _dbContext.SaveChangesAsync();

        var actor = await _userService.GetUser();
        _pollUpdateQueue.EnqueuePollUpdate(poll.Id, actor.Payload!.Name ?? "Unknown", actor.Payload!.Id,
            oldName, poll.Name, oldDescription, poll.Description);

        await _pollChangeNotifier.PollChanged(poll.Id, actor.Payload!.Id);

        return Result<Poll>.Success(poll);
    }

    public async Task<Result<Poll>> GetPoll(string slug)
    {
        var poll = await _dbContext.Polls
            .IncludeDetails()
            .WhereReadableBy(slug, UserId)
            .SingleOrDefaultAsync();

        if (poll is null)
        {
            return Result<Poll>.Fail(404);
        }

        return Result<Poll>.Success(poll);
    }

    public async Task<Result<PollDelta>> GetPollDelta(string slug, DateTime? since)
    {
        // Captured before the read so the token the client echoes next time is never ahead of
        // what this response reflects.
        var syncToken = DateTime.UtcNow;
        // No token yet → return everything. Otherwise widen the window slightly so rows committed
        // right at the boundary aren't missed (the client upserts by id, so overlap is harmless).
        var sinceCutoff = since.HasValue ? since.Value.ToUniversalTime() - DeltaOverlap : DateTime.MinValue;

        var poll = await _dbContext.Polls
            .IncludeDetails()
            .WhereReadableBy(slug, UserId)
            .SingleOrDefaultAsync();

        if (poll is null)
        {
            return Result<PollDelta>.Fail(404);
        }

        // A vote change stamps Vote.Edited but not Option.Edited, so an option counts as changed
        // when the option itself or any of its votes changed. The delta re-sends the whole option
        // (votes included), so the client sees the new tally.
        var changedOptions = poll.Options
            .Where(o => o.Edited > sinceCutoff || o.Votes.Any(v => v.Edited > sinceCutoff))
            .ToList();

        var changedComments = poll.Comments
            .Where(c => c.Edited > sinceCutoff)
            .ToList();

        var changedPoll = poll.Edited > sinceCutoff ? poll : null;

        return Result<PollDelta>.Success(new PollDelta(
            changedPoll,
            changedOptions,
            changedComments,
            poll.Options,
            poll.Comments,
            syncToken));
    }

    public async Task<Result<Poll>> ClosePollAsync(string slug)
    {
        var poll = await _dbContext.Polls
            .IncludeProjectMembers()
            .IncludeDetails()
            .WhereMaintainableBy(slug, UserId)
            .SingleOrDefaultAsync();

        if (poll is null)
        {
            return Result<Poll>.Fail(404);
        }

        var actor = await _userService.GetUser();
        poll.CloseDate = DateTime.UtcNow;
        AddStatusChange(poll, PollStatusAction.Closed, actor.Payload!);
        await _dbContext.SaveChangesAsync();

        await _projectNotificationService.SendPollClosedNotificationsAsync(
            GetRecipients(poll, actor.Payload!.Id), actor.Payload!.Name ?? "Unknown", poll.Project, poll);

        await _pollChangeNotifier.PollChanged(poll.Id, actor.Payload!.Id);

        return Result<Poll>.Success(poll);
    }

    public async Task<Result<Poll>> ReopenPollAsync(string slug)
    {
        var poll = await _dbContext.Polls
            .IncludeProjectMembers()
            .IncludeDetails()
            .WhereMaintainableBy(slug, UserId)
            .SingleOrDefaultAsync();

        if (poll is null)
        {
            return Result<Poll>.Fail(404);
        }

        var actor = await _userService.GetUser();
        poll.CloseDate = null;
        AddStatusChange(poll, PollStatusAction.Reopened, actor.Payload!);
        await _dbContext.SaveChangesAsync();

        await _projectNotificationService.SendPollReopenedNotificationsAsync(
            GetRecipients(poll, actor.Payload!.Id), actor.Payload!.Name ?? "Unknown", poll.Project, poll);

        await _pollChangeNotifier.PollChanged(poll.Id, actor.Payload!.Id);

        return Result<Poll>.Success(poll);
    }

    private void AddStatusChange(Poll poll, PollStatusAction action, Person changedBy)
    {
        var statusChange = new PollStatusChange
        {
            Id = Guid.NewGuid(),
            Action = action,
            Poll = poll,
            ChangedBy = changedBy,
        };
        poll.StatusChanges.Add(statusChange);
        _dbContext.PollStatusChanges.Add(statusChange);
    }

    /// <summary>Everyone on the poll's project except the actor.</summary>
    private static List<Person> GetRecipients(Poll poll, Guid actorId)
    {
        return poll.Project.Permissions
            .Select(p => p.Person)
            .Append(poll.Project.Creator)
            .Where(p => p.Id != actorId)
            .ToList();
    }
}
