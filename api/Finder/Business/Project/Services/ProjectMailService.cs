using Finder.Business.Auth.Entities;
using Finder.Business.Project.Entities;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;

namespace Finder.Business.Project.Services;

public class ProjectMailService(MailService mailService, NotificationMailGuard notificationMailGuard, LanguageService languageService, PollChangesBuilder pollChangesBuilder)
{
    public async Task SendPollClosedNotificationsAsync(IEnumerable<Person> recipients, string actionUserName,
        Entities.Project project, Poll poll, string language = "en")
    {
        foreach (var recipient in recipients)
            await SendNotificationAsync(recipient, actionUserName, project, poll, null, null,
                languageService.Get("poll.closed.subject", language),
                languageService.Get("poll.closed.preheader", language),
                "poll-closed", NotificationKey.PollClosed, language);
    }

    public async Task SendPollReopenedNotificationsAsync(IEnumerable<Person> recipients, string actionUserName,
        Entities.Project project, Poll poll, string language = "en")
    {
        foreach (var recipient in recipients)
            await SendNotificationAsync(recipient, actionUserName, project, poll, null, null,
                languageService.Get("poll.reopened.subject", language),
                languageService.Get("poll.reopened.preheader", language),
                "poll-reopened", NotificationKey.PollReopened, language);
    }

    public async Task SendPollUpdatedNotificationsAsync(IEnumerable<Person> recipients, string actionUserName,
        Entities.Project project, Poll poll, PollUpdateSummary summary, string language = "en")
    {
        foreach (var recipient in recipients)
            await SendNotificationAsync(recipient, actionUserName, project, poll, null, summary,
                languageService.Get("poll.updated.subject", language),
                languageService.Get("poll.updated.preheader", language),
                "poll-updated", NotificationKey.PollUpdated, language);
    }

    public async Task SendNewCommentNotificationsAsync(IEnumerable<Person> recipients, string actionUserName,
        Entities.Project project, Poll poll, string commentContent, string language = "en")
    {
        foreach (var recipient in recipients)
            await SendNotificationAsync(recipient, actionUserName, project, poll, commentContent, null,
                languageService.Get("poll.comment.subject", language),
                languageService.Get("poll.comment.preheader", language),
                "new-comment", NotificationKey.NewComment, language);
    }

    private async Task SendNotificationAsync(Person recipient, string actionUserName, Entities.Project project,
        Poll poll, string? commentContent, PollUpdateSummary? summary, string subject, string preheader,
        string templateName, NotificationKey notificationKey, string language)
    {
        if (recipient.Role == Role.TestUser) return;

        if (!await notificationMailGuard.ShouldSendAsync(recipient.Id, notificationKey, project.Id)) return;

        var variables = new Dictionary<string, string>
        {
            ["recipient"] = recipient.Name ?? recipient.Email,
            ["user"] = actionUserName,
            ["poll"] = poll.Name
        };

        if (commentContent is not null)
            variables["comment"] = commentContent;

        Dictionary<string, string>? rawHtml = null;
        if (summary is not null)
            rawHtml = new Dictionary<string, string> { ["changesHtml"] = pollChangesBuilder.Build(summary, language) };

        var mail = new Mail(
            subject,
            recipient.Name ?? recipient.Email,
            recipient.Email,
            new MailTemplate(templateName, language, variables, preheader, rawHtml)
        );

        try
        {
            await mailService.SendAsync(mail);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error while sending mail: " + ex.Message);
        }
    }
}
