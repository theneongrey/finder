using Finder.Business.Auth.Entities;
using Finder.Business.Permission.Entities;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Business.User.Services;

namespace Finder.Business.Permission.Services;

public class PermissionNotificationService(
    InAppNotificationService inAppNotificationService,
    PermissionMailService mailService,
    NotificationMailGuard notificationMailGuard)
{
    public async Task SendPermissionMailAsync(Person recipient, string actionUserName,
        Project.Entities.Project project, PermissionType permissionType, bool isExistingPermission,
        bool isNewUser, string language = "en")
    {
        var notificationKey = isExistingPermission ? NotificationKey.AccessChanged : NotificationKey.PollShared;

        await inAppNotificationService.CreateAsync(
            recipient.Id, notificationKey,
            projectId: project.Id, pollId: null,
            new Dictionary<string, string> { ["user"] = actionUserName, ["poll"] = project.Name });

        if (recipient.Role == Role.TestUser) return;
        if (!await notificationMailGuard.ShouldSendAsync(recipient.Id, notificationKey, project.Id)) return;

        await mailService.SendPermissionMailAsync(recipient, actionUserName, project, permissionType,
            isExistingPermission, isNewUser, language);
    }

    public async Task SendPermissionRemovedMailAsync(Person recipient, string actionUserName,
        Project.Entities.Project project, string language = "en")
    {
        await inAppNotificationService.CreateAsync(
            recipient.Id, NotificationKey.AccessChanged,
            projectId: project.Id, pollId: null,
            new Dictionary<string, string> { ["user"] = actionUserName, ["poll"] = project.Name });

        if (recipient.Role == Role.TestUser) return;
        if (!await notificationMailGuard.ShouldSendAsync(recipient.Id, NotificationKey.AccessChanged, project.Id)) return;

        await mailService.SendPermissionRemovedMailAsync(recipient, actionUserName, project, language);
    }
}
