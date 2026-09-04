using Finder.Business.Auth.Entities;
using Finder.Business.Permission.Entities;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Microsoft.Extensions.Options;

namespace Finder.Business.Permission.Services;

public class PermissionMailService(MailService mailService, LanguageService languageService, IOptions<AppOptions> appOptions)
{
    public async Task SendPermissionMailAsync(Person recipient, string actionUserName, Project.Entities.Project project,
        PermissionType permissionType, bool isExistingPermission, bool isNewUser)
    {
        var permissionName = Enum.GetName(permissionType) ?? "Unknown";

        if (isExistingPermission)
        {
            await SendMailAsync(recipient, actionUserName, project, permissionName,
                languageService.Get("permission.update.subject", recipient.Language),
                languageService.Get("permission.update.preheader", recipient.Language),
                "permission-update");
        }
        else if (isNewUser)
        {
            await SendMailAsync(recipient, actionUserName, project, permissionName,
                languageService.Get("permission.invitation.subject", recipient.Language),
                languageService.Get("permission.invitation.preheader", recipient.Language),
                "permission-shared-invited");
        }
        else
        {
            await SendMailAsync(recipient, actionUserName, project, permissionName,
                languageService.Get("permission.shared.subject", recipient.Language),
                languageService.Get("permission.shared.preheader", recipient.Language),
                "permission-shared");
        }
    }

    public async Task SendPermissionRemovedMailAsync(Person recipient, string actionUserName,
        Project.Entities.Project project)
    {
        await SendMailAsync(recipient, actionUserName, project, string.Empty,
            languageService.Get("permission.removed.subject", recipient.Language),
            languageService.Get("permission.removed.preheader", recipient.Language),
            "permission-removed");
    }

    private async Task SendMailAsync(Person recipient, string userName, Project.Entities.Project project,
        string permission, string subject, string preheader, string templateName)
    {
        var mail = new Mail(
            subject,
            recipient.Name ?? recipient.Email,
            recipient.Email,
            new MailTemplate(templateName, recipient.Language, new Dictionary<string, string>
            {
                ["recipient"] = recipient.Name ?? recipient.Email,
                ["user"] = userName,
                ["permission"] = permission,
                ["poll"] = project.Polls.FirstOrDefault()?.Name ?? project.Name,
                ["projectLink"] = $"{appOptions.Value.BaseUrl}/p/{project.Id}"
            }, preheader)
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
