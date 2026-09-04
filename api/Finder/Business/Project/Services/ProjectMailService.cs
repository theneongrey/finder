using Finder.Business.Auth.Entities;
using Finder.Business.Project.Entities;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Microsoft.Extensions.Options;

namespace Finder.Business.Project.Services;

public class ProjectMailService(MailService mailService, LanguageService languageService, PollChangesBuilder pollChangesBuilder, IOptions<AppOptions> appOptions)
{
    public async Task SendPollClosedMailAsync(Person recipient, string actionUserName,
        Entities.Project project, Poll poll, string language = "en")
        => await SendMailAsync(recipient, actionUserName, project, poll, null, null,
            languageService.Get("poll.closed.subject", language),
            languageService.Get("poll.closed.preheader", language),
            "poll-closed", language);

    public async Task SendPollReopenedMailAsync(Person recipient, string actionUserName,
        Entities.Project project, Poll poll, string language = "en")
        => await SendMailAsync(recipient, actionUserName, project, poll, null, null,
            languageService.Get("poll.reopened.subject", language),
            languageService.Get("poll.reopened.preheader", language),
            "poll-reopened", language);

    public async Task SendPollUpdatedMailAsync(Person recipient, string actionUserName,
        Entities.Project project, Poll poll, PollUpdateSummary summary, string language = "en")
        => await SendMailAsync(recipient, actionUserName, project, poll, null, summary,
            languageService.Get("poll.updated.subject", language),
            languageService.Get("poll.updated.preheader", language),
            "poll-updated", language);

    public async Task SendNewCommentMailAsync(Person recipient, string actionUserName,
        Entities.Project project, Poll poll, string commentContent, string language = "en")
        => await SendMailAsync(recipient, actionUserName, project, poll, commentContent, null,
            languageService.Get("poll.comment.subject", language),
            languageService.Get("poll.comment.preheader", language),
            "new-comment", language);

    private async Task SendMailAsync(Person recipient, string actionUserName, Entities.Project project,
        Poll poll, string? commentContent, PollUpdateSummary? summary, string subject, string preheader,
        string templateName, string language)
    {
        var variables = new Dictionary<string, string>
        {
            ["recipient"] = recipient.Name ?? recipient.Email,
            ["user"] = actionUserName,
            ["poll"] = poll.Name,
            ["projectLink"] = $"{appOptions.Value.BaseUrl}/p/{project.Id}"
        };

        if (commentContent is not null)
        {
            variables["comment"] = commentContent;
        }

        Dictionary<string, string>? rawHtml = null;
        if (summary is not null)
        {
            rawHtml = new Dictionary<string, string> { ["changesHtml"] = pollChangesBuilder.Build(summary, language) };
        }

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
