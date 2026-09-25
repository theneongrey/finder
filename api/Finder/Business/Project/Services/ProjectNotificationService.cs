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

    /// <summary>
    /// A recipient actively present on the poll is watching it live, so a duplicate e-mail is just
    /// noise — skip it. The in-app notification is still created (persistent record), and a
    /// present-but-idle or absent recipient falls through and is e-mailed per their settings.
    /// </summary>
    private bool IsWatchingLive(Poll poll, Guid recipientId) =>
        presenceRegistry.IsUserActive(poll.Id, recipientId, _idleThreshold);

    public async Task SendPollClosedNotificationsAsync(IEnumerable<Person> recipients, string actionUserName,
        Entities.Project project, Poll poll)
    {
        foreach (var recipient in recipients)
        {
            await inAppNotificationService.CreateAsync(
                recipient.Id, NotificationKey.PollClosed,
                projectId: project.Id, pollId: poll.Id,
                new Dictionary<string, string> { ["user"] = actionUserName, ["poll"] = poll.Name });

            if (recipient.Role == Role.TestUser)
            {
                continue;
            }

            if (IsWatchingLive(poll, recipient.Id))
            {
                continue;
            }

            if (!await notificationMailGuard.ShouldSendAsync(recipient.Id, NotificationKey.PollClosed, project.Id))
            {
                continue;
            }

            await mailService.SendPollClosedMailAsync(recipient, actionUserName, project, poll, recipient.Language);
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

            if (recipient.Role == Role.TestUser)
            {
                continue;
            }

            if (IsWatchingLive(poll, recipient.Id))
            {
                continue;
            }

            if (!await notificationMailGuard.ShouldSendAsync(recipient.Id, NotificationKey.PollReopened, project.Id))
            {
                continue;
            }

            await mailService.SendPollReopenedMailAsync(recipient, actionUserName, project, poll, recipient.Language);
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

            if (recipient.Role == Role.TestUser)
            {
                continue;
            }

            if (IsWatchingLive(poll, recipient.Id))
            {
                continue;
            }

            if (!await notificationMailGuard.ShouldSendAsync(recipient.Id, NotificationKey.PollUpdated, project.Id))
            {
                continue;
            }

            await mailService.SendPollUpdatedMailAsync(recipient, actionUserName, project, poll, summary);
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

            if (recipient.Role == Role.TestUser)
            {
                continue;
            }

            if (IsWatchingLive(poll, recipient.Id))
            {
                continue;
            }

            if (!await notificationMailGuard.ShouldSendAsync(recipient.Id, NotificationKey.NewComment, project.Id))
            {
                continue;
            }

            await mailService.SendNewCommentMailAsync(recipient, actionUserName, project, poll, commentContent);
        }
    }
}
