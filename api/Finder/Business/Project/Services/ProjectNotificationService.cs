using Finder.Business.Auth.Entities;
using Finder.Business.Project.Entities;
using Finder.Business.Project.RealTime;
using Finder.Business.Project.Setup;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Business.User.Services;
using Microsoft.Extensions.Options;

namespace Finder.Business.Project.Services;

public class ProjectNotificationService(
    InAppNotificationService inAppNotificationService,
    ProjectMailService mailService,
    NotificationMailGuard notificationMailGuard,
    PollPresenceRegistry presenceRegistry,
    IOptions<NotificationOptions> notificationOptions)
{
    private readonly TimeSpan _idleThreshold =
        TimeSpan.FromSeconds(notificationOptions.Value.ActivePresenceIdleSeconds);

    public async Task SendPollClosedNotificationsAsync(IEnumerable<Person> recipients, string actionUserName,
        Entities.Project project, Poll poll)
    {
        foreach (var recipient in recipients)
        {
            await inAppNotificationService.CreateAsync(
                recipient.Id, NotificationKey.PollClosed,
                projectId: project.Id, pollId: poll.Id,
                new Dictionary<string, string> { ["user"] = actionUserName, ["poll"] = poll.Name });

            if (await ShouldSendMailAsync(recipient, NotificationKey.PollClosed, project, poll))
            {
                await mailService.SendPollClosedMailAsync(recipient, actionUserName, project, poll, recipient.Language);
            }
        }
    }

    public async Task SendPollReopenedNotificationsAsync(IEnumerable<Person> recipients, string actionUserName,
        Entities.Project project, Poll poll)
    {
        foreach (var recipient in recipients)
        {
            await inAppNotificationService.CreateAsync(
                recipient.Id, NotificationKey.PollReopened,
                projectId: project.Id, pollId: poll.Id,
                new Dictionary<string, string> { ["user"] = actionUserName, ["poll"] = poll.Name });

            if (await ShouldSendMailAsync(recipient, NotificationKey.PollReopened, project, poll))
            {
                await mailService.SendPollReopenedMailAsync(recipient, actionUserName, project, poll, recipient.Language);
            }
        }
    }

    public async Task SendPollUpdatedNotificationsAsync(IEnumerable<Person> recipients, string actionUserName,
        Entities.Project project, Poll poll, PollUpdateSummary summary)
    {
        foreach (var recipient in recipients)
        {
            await inAppNotificationService.CreateAsync(
                recipient.Id, NotificationKey.PollUpdated,
                projectId: project.Id, pollId: poll.Id,
                new Dictionary<string, string> { ["user"] = actionUserName, ["poll"] = poll.Name });

            if (await ShouldSendMailAsync(recipient, NotificationKey.PollUpdated, project, poll))
            {
                await mailService.SendPollUpdatedMailAsync(recipient, actionUserName, project, poll, summary);
            }
        }
    }

    public async Task SendNewCommentNotificationsAsync(IEnumerable<Person> recipients, string actionUserName,
        Entities.Project project, Poll poll, string commentContent)
    {
        foreach (var recipient in recipients)
        {
            await inAppNotificationService.CreateAsync(
                recipient.Id, NotificationKey.NewComment,
                projectId: project.Id, pollId: poll.Id,
                new Dictionary<string, string> { ["user"] = actionUserName, ["poll"] = poll.Name });

            if (await ShouldSendMailAsync(recipient, NotificationKey.NewComment, project, poll))
            {
                await mailService.SendNewCommentMailAsync(recipient, actionUserName, project, poll, commentContent);
            }
        }
    }

    /// <summary>
    /// Whether the recipient should also get an e-mail. Test users never do; a recipient actively
    /// present on the poll is watching it live, so a duplicate e-mail is just noise. A present-but-idle
    /// or absent recipient falls through to their mail settings.
    /// </summary>
    private async Task<bool> ShouldSendMailAsync(Person recipient, NotificationKey key, Entities.Project project,
        Poll poll)
    {
        if (recipient.Role == Role.TestUser)
        {
            return false;
        }

        if (presenceRegistry.IsUserActive(poll.Id, recipient.Id, _idleThreshold))
        {
            return false;
        }

        return await notificationMailGuard.ShouldSendAsync(recipient.Id, key, project.Id);
    }
}
