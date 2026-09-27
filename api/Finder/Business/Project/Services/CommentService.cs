using Finder.Business.Project.Api.Requests;
using Finder.Business.Project.Entities;
using Finder.Business.Project.RealTime;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Project.Services;

public class CommentService
{
    private readonly AppDbContext _dbContext;
    private readonly UserService _userService;
    private readonly ProjectNotificationService _projectNotificationService;
    private readonly IPollChangeNotifier _pollChangeNotifier;

    private Guid? UserId => _userService.GetUserId();

    public CommentService(AppDbContext dbContext, UserService userService,
        ProjectNotificationService projectNotificationService, IPollChangeNotifier pollChangeNotifier)
    {
        _dbContext = dbContext;
        _userService = userService;
        _projectNotificationService = projectNotificationService;
        _pollChangeNotifier = pollChangeNotifier;
    }

    public async Task<Result<Comment>> AddComment(AddCommentRequest request)
    {
        var poll = await _dbContext.Polls
            .IncludeProjectMembers()
            .Include(t => t.Options)
            .WhereReadableBy(request.PollId, UserId)
            .FirstOrDefaultAsync();

        if (poll is null)
        {
            return Result<Comment>.Fail(404);
        }

        Option? option = null;
        if (request.OptionId is not null)
        {
            var optionId = SlugHelper.ExtractId(request.OptionId);
            option = poll.Options.FirstOrDefault(o => o.Id == optionId);
            if (option is null)
            {
                return Result<Comment>.Fail(404);
            }
        }

        var user = (await _userService.GetUser()).Payload!;

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Content = request.Content.StripHtml(),
            Quote = request.Quote?.StripHtml(),
            Poll = poll,
            Person = user,
            Option = option
        };
        poll.Comments.Add(comment);

        _dbContext.Comments.Add(comment);

        await _dbContext.SaveChangesAsync();

        var recipients = poll.Project.Permissions
            .Select(p => p.Person)
            .Append(poll.Project.Creator)
            .Where(p => p.Id != user.Id)
            .ToList();
        await _projectNotificationService.SendNewCommentNotificationsAsync(
            recipients, user.Name ?? "Unknown", poll.Project, poll, comment.Content);

        await _pollChangeNotifier.PollChanged(poll.Id, user.Id);

        return Result<Comment>.Success(comment);
    }
}
