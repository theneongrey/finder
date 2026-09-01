using Finder.Business.Auth.Entities;
using Finder.Business.Permission.Entities;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;

namespace Finder.Business.Permission.Services;

public class PermissionMailService(MailService mailService, NotificationMailGuard notificationMailGuard, LanguageService languageService)
{
    public async Task SendPermissionMail(Person recipient, string actionUserName, Project.Entities.Project project,
        PermissionType permissionType, bool isExistingPermission, bool isNewUser, string language = "en")
    {
        var permissionName = Enum.GetName(permissionType) ?? "Unknown";

        if (isExistingPermission)
        {
            await SendMail(recipient, actionUserName, project, permissionName,
                languageService.Get("permission.update.subject", language),
                languageService.Get("permission.update.preheader", language),
                "permission-update", NotificationKey.AccessChanged, language);
        }
        else if (isNewUser)
        {
            await SendMail(recipient, actionUserName, project, permissionName,
                languageService.Get("permission.invitation.subject", language),
                languageService.Get("permission.invitation.preheader", language),
                "permission-shared-invited", NotificationKey.PollShared, language);
        }
        else
        {
            await SendMail(recipient, actionUserName, project, permissionName,
                languageService.Get("permission.shared.subject", language),
                languageService.Get("permission.shared.preheader", language),
                "permission-shared", NotificationKey.PollShared, language);
        }
    }

    public async Task SendPermissionRemovedMailAsync(Person recipient, string actionUserName,
        Project.Entities.Project project, string language = "en")
    {
        await SendMail(recipient, actionUserName, project, string.Empty,
            languageService.Get("permission.removed.subject", language),
            languageService.Get("permission.removed.preheader", language),
            "permission-removed", NotificationKey.AccessChanged, language);
    }

    private async Task SendMail(Person recipient, string userName, Project.Entities.Project project, string permission,
        string subject, string preheader, string templateName, NotificationKey notificationKey, string language)
    {
        if (recipient.Role == Role.TestUser) return;

        if (!await notificationMailGuard.ShouldSendAsync(recipient.Id, notificationKey, project.Id)) return;

        var mail = new Mail(
            subject,
            recipient.Name ?? recipient.Email,
            recipient.Email,
            new MailTemplate(templateName, language, new Dictionary<string, string>
            {
                ["recipient"] = recipient.Name ?? recipient.Email,
                ["user"] = userName,
                ["project"] = project.Name,
                ["permission"] = permission
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
