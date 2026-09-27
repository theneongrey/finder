using Finder.Business.Permission.Entities;
using Finder.Business.Project.Api.Requests;
using Finder.Business.Project.Entities;
using Finder.Business.Project.RealTime;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Project.Services;

public class OptionService
{
    private readonly AppDbContext _dbContext;
    private readonly UserService _userService;
    private readonly PollUpdateNotificationQueue _pollUpdateQueue;
    private readonly IPollChangeNotifier _pollChangeNotifier;

    private Guid? UserId => _userService.GetUserId();

    public OptionService(AppDbContext dbContext, UserService userService,
        PollUpdateNotificationQueue pollUpdateQueue, IPollChangeNotifier pollChangeNotifier)
    {
        _dbContext = dbContext;
        _userService = userService;
        _pollUpdateQueue = pollUpdateQueue;
        _pollChangeNotifier = pollChangeNotifier;
    }

    /// <summary>
    /// True when the current user may manage (edit/delete options, close, …) the given project:
    /// its creator, or a Maintainer/Owner permission holder. Requires the project's Creator and
    /// Permissions (with Person) to be loaded.
    /// </summary>
    private bool CanManage(Entities.Project project) =>
        project.Creator.Id == UserId ||
        project.Permissions.Any(permission =>
            permission.Person.Id == UserId && permission.PermissionType >= PermissionType.Maintainer);

    public async Task<Result<Option>> AddOptionToPoll(AddOptionToPollRequest pollRequest)
    {
        var poll = await _dbContext.Polls
            .WhereMaintainableBy(pollRequest.PollId, UserId)
            .FirstOrDefaultAsync();

        if (poll is null)
        {
            return Result<Option>.Fail(404);
        }

        if (poll.CloseDate.HasValue && poll.CloseDate <= DateTime.UtcNow)
        {
            return Result<Option>.Fail(409);
        }

        var creator = (await _userService.GetUser()).Payload!;

        var option = new Option
        {
            Id = SlugHelper.GenerateId(),
            Text = pollRequest.Text.StripHtml(),
            Description = pollRequest.Description.StripHtml(),
            Poll = poll,
            Creator = creator
        };

        if (pollRequest.Meta is not null)
        {
            option.Meta = new OptionMeta
            {
                Id = option.Id,
                Url = pollRequest.Meta.Url,
                Title = pollRequest.Meta.Title.StripHtml(),
                Description = pollRequest.Meta.Description.StripHtml(),
                ImageUrl = pollRequest.Meta.ImageUrl,
                SiteName = pollRequest.Meta.SiteName.StripHtml(),
                Option = option
            };
        }

        poll.Options.Add(option);

        _dbContext.Options.Add(option);

        await _dbContext.SaveChangesAsync();

        _pollUpdateQueue.EnqueueOptionAdded(poll.Id, option.Id, option.Text, creator.Name ?? "Unknown",
            creator.Id);

        await _pollChangeNotifier.PollChanged(poll.Id, creator.Id,
            new PollChangeInfo(PollChangeKind.OptionAdded, option.Text));

        return Result<Option>.Success(option);
    }

    public async Task<Result<Option>> UpdateOption(string slug, UpdateOptionRequest request)
    {
        // View-scoped lookup (404 when unknown/hidden), then a manage check below (403 when the
        // user may see the poll but not edit it) — so permission failures aren't masked as 404.
        var option = await _dbContext.Options
            .Include(o => o.Poll).ThenInclude(p => p.Project).ThenInclude(pr => pr.Creator)
            .Include(o => o.Poll).ThenInclude(p => p.Project).ThenInclude(pr => pr.Permissions)
                .ThenInclude(perm => perm.Person)
            .Include(o => o.Meta)
            .Include(o => o.Votes)
            .ThenInclude(v => v.Person)
            .WhereReadableBy(slug, UserId)
            .FirstOrDefaultAsync();

        if (option is null)
        {
            return Result<Option>.Fail(404);
        }

        if (!CanManage(option.Poll.Project))
        {
            return Result<Option>.Fail(403);
        }

        if (option.Poll.CloseDate.HasValue && option.Poll.CloseDate <= DateTime.UtcNow)
        {
            return Result<Option>.Fail(409);
        }

        var cleanText = request.Text.StripHtml();
        var cleanDescription = request.Description.StripHtml();

        var oldText = option.Text;
        var oldDescription = option.Description;
        var textChanged = option.Text != cleanText;
        var descriptionChanged = option.Description != cleanDescription;
        var descriptionAdded = string.IsNullOrWhiteSpace(oldDescription) &&
                               !string.IsNullOrWhiteSpace(cleanDescription);

        option.Text = cleanText;
        option.Description = cleanDescription;

        var metaChanged = false;

        if (request.Meta is not null)
        {
            if (option.Meta is not null)
            {
                var oldOptionValues = option.Meta.Url + option.Meta.Title + option.Meta.Description +
                                      option.Meta.ImageUrl + option.Meta.SiteName;
                var newOptionValues = request.Meta.Url + request.Meta.Title + request.Meta.Description +
                                      request.Meta.ImageUrl + request.Meta.SiteName;

                metaChanged = oldOptionValues != newOptionValues;

                option.Meta.Url = request.Meta.Url;
                option.Meta.Title = request.Meta.Title.StripHtml();
                option.Meta.Description = request.Meta.Description.StripHtml();
                option.Meta.ImageUrl = request.Meta.ImageUrl;
                option.Meta.SiteName = request.Meta.SiteName.StripHtml();
            }
            else
            {
                metaChanged = true;
                option.Meta = new OptionMeta
                {
                    Id = option.Id,
                    Url = request.Meta.Url,
                    Title = request.Meta.Title.StripHtml(),
                    Description = request.Meta.Description.StripHtml(),
                    ImageUrl = request.Meta.ImageUrl,
                    SiteName = request.Meta.SiteName.StripHtml(),
                    Option = option
                };
            }
        }
        else if (option.Meta is not null)
        {
            metaChanged = true;
            _dbContext.OptionMetas.Remove(option.Meta);
            option.Meta = null;
        }

        await _dbContext.SaveChangesAsync();

        var updateActor = await _userService.GetUser();

        if (textChanged || descriptionChanged || metaChanged)
        {
            _pollUpdateQueue.EnqueueOptionModified(option.Poll.Id, updateActor.Payload!.Name ?? "Unknown",
                updateActor.Payload!.Id);

            // Classify the edit so present clients see a specific message. A rename is the most
            // salient change; otherwise call out a freshly-added description; else it's a generic
            // update (description reworded, link/image meta changed, …).
            var optionChange = textChanged
                ? new PollChangeInfo(PollChangeKind.OptionRenamed, cleanText)
                : descriptionAdded
                    ? new PollChangeInfo(PollChangeKind.OptionDescribed, oldText)
                    : new PollChangeInfo(PollChangeKind.OptionUpdated, oldText);
            await _pollChangeNotifier.PollChanged(option.Poll.Id, updateActor.Payload!.Id, optionChange);
        }

        return Result<Option>.Success(option);
    }

    public async Task<Result> DeleteOption(string slug)
    {
        // Scope the lookup to polls the user can *see* so a genuinely unknown/hidden option is a 404;
        // the manage check below then distinguishes "you may view but not delete" as a 403.
        var option = await _dbContext.Options
            .Include(o => o.Poll).ThenInclude(p => p.Project).ThenInclude(pr => pr.Creator)
            .Include(o => o.Poll).ThenInclude(p => p.Project).ThenInclude(pr => pr.Permissions)
                .ThenInclude(perm => perm.Person)
            .WhereReadableBy(slug, UserId)
            .FirstOrDefaultAsync();

        if (option is null)
        {
            return Result.Fail(404);
        }

        if (!CanManage(option.Poll.Project))
        {
            return Result.Fail(403);
        }

        if (option.Poll.CloseDate.HasValue && option.Poll.CloseDate <= DateTime.UtcNow)
        {
            return Result.Fail(409);
        }

        var pollId = option.Poll.Id;
        var optionId = option.Id;
        var optionText = option.Text;
        _dbContext.Options.Remove(option);
        await _dbContext.SaveChangesAsync();

        var deleteActor = await _userService.GetUser();
        _pollUpdateQueue.EnqueueOptionRemoved(pollId, optionId, optionText, deleteActor.Payload!.Name ?? "Unknown",
            deleteActor.Payload!.Id);

        await _pollChangeNotifier.PollChanged(pollId, deleteActor.Payload!.Id,
            new PollChangeInfo(PollChangeKind.OptionRemoved, optionText));

        return Result.Success();
    }
}
