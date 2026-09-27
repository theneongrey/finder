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

    public Task SendPollClosedNotificationsAsync(IEnumerable<Person> recipients, string actionUserName,
        Entities.Project project, Poll poll) =>
        NotifyAsync(recipients, NotificationKey.PollClosed, actionUserName, project, poll,
            recipient => mailService.SendPollClosedMailAsync(recipient, actionUserName, project, poll, recipient.Language));

    public Task SendPollReopenedNotificationsAsync(IEnumerable<Person> recipients, string actionUserName,
        Entities.Project project, Poll poll) =>
        NotifyAsync(recipients, NotificationKey.PollReopened, actionUserName, project, poll,
            recipient => mailService.SendPollReopenedMailAsync(recipient, actionUserName, project, poll, recipient.Language));

    public Task SendPollUpdatedNotificationsAsync(IEnumerable<Person> recipients, string actionUserName,
        Entities.Project project, Poll poll, PollUpdateSummary summary) =>
        NotifyAsync(recipients, NotificationKey.PollUpdated, actionUserName, project, poll,
            recipient => mailService.SendPollUpdatedMailAsync(recipient, actionUserName, project, poll, summary));

    public Task SendNewCommentNotificationsAsync(IEnumerable<Person> recipients, string actionUserName,
        Entities.Project project, Poll poll, string commentContent) =>
        NotifyAsync(recipients, NotificationKey.NewComment, actionUserName, project, poll,
            recipient => mailService.SendNewCommentMailAsync(recipient, actionUserName, project, poll, commentContent));

    /// <summary>
    /// Shared per-recipient pipeline: the in-app notification is always created (persistent record);
    /// the e-mail is skipped for test users, for recipients actively present on the poll (they are
    /// watching it live, so a duplicate e-mail is just noise), and when the recipient's mail settings
    /// opt out. A present-but-idle or absent recipient falls through and is e-mailed.
    /// </summary>
    private async Task NotifyAsync(IEnumerable<Person> recipients, NotificationKey key, string actionUserName,
        Entities.Project project, Poll poll, Func<Person, Task> sendMail)
    {
        foreach (var recipient in recipients)
        {
            await inAppNotificationService.CreateAsync(
                recipient.Id, key,
                projectId: project.Id, pollId: poll.Id,
                new Dictionary<string, string> { ["user"] = actionUserName, ["poll"] = poll.Name });

            if (recipient.Role == Role.TestUser)
            {
                continue;
            }

            if (presenceRegistry.IsUserActive(poll.Id, recipient.Id, _idleThreshold))
            {
                continue;
            }

            if (!await notificationMailGuard.ShouldSendAsync(recipient.Id, key, project.Id))
            {
                continue;
            }

            await sendMail(recipient);
        }
    }
}
