using Finder.Business.Auth.Entities;
using Finder.Business.Permission.Entities;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Microsoft.Extensions.Options;

namespace Finder.Business.Permission.Services;

public class PermissionMailService(MailService mailService, LanguageService languageService, IOptions<AppOptions> appOptions)
{
    public async Task SendPermissionMailAsync(Person recipient, string actionUserName, Project.Entities.Project project,
        PermissionType permissionType, bool isExistingPermission, bool isNewUser, string language = "en")
    {
        var permissionName = Enum.GetName(permissionType) ?? "Unknown";

        if (isExistingPermission)
        {
            await SendMailAsync(recipient, actionUserName, project, permissionName,
                languageService.Get("permission.update.subject", language),
                languageService.Get("permission.update.preheader", language),
                "permission-update", language);
        }
        else if (isNewUser)
        {
            await SendMailAsync(recipient, actionUserName, project, permissionName,
                languageService.Get("permission.invitation.subject", language),
                languageService.Get("permission.invitation.preheader", language),
                "permission-shared-invited", language);
        }
        else
        {
            await SendMailAsync(recipient, actionUserName, project, permissionName,
                languageService.Get("permission.shared.subject", language),
                languageService.Get("permission.shared.preheader", language),
                "permission-shared", language);
        }
    }

    public async Task SendPermissionRemovedMailAsync(Person recipient, string actionUserName,
        Project.Entities.Project project, string language = "en")
    {
        await SendMailAsync(recipient, actionUserName, project, string.Empty,
            languageService.Get("permission.removed.subject", language),
            languageService.Get("permission.removed.preheader", language),
            "permission-removed", language);
    }

    private async Task SendMailAsync(Person recipient, string userName, Project.Entities.Project project,
        string permission, string subject, string preheader, string templateName, string language)
    {
        var mail = new Mail(
            subject,
            recipient.Name ?? recipient.Email,
            recipient.Email,
            new MailTemplate(templateName, language, new Dictionary<string, string>
            {
                ["recipient"] = recipient.Name ?? recipient.Email,
                ["user"] = userName,
                ["permission"] = permission,
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
