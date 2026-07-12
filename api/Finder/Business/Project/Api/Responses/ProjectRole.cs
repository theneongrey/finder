using Finder.Business.Permission.Entities;

namespace Finder.Business.Project.Api.Responses;

public enum ProjectRole
{
    Unknown,
    Voter,
    Maintainer,
    Owner,
    Creator
}

public static class ProjectRoleExtensions
{
    public static ProjectRole ToProjectRole(this PermissionType permissionType)
    {
        switch (permissionType)
        {
            case PermissionType.Voter:
                return ProjectRole.Voter;
            case PermissionType.Maintainer:
                return ProjectRole.Maintainer;
            case PermissionType.Owner:
                return ProjectRole.Owner;
            default:
                throw new ArgumentOutOfRangeException(nameof(permissionType), permissionType, null);
        }
    }

    public static ProjectRole GetRole(this Entities.Project project, Guid? userId)
    {
        if (project.Creator.Id == userId)
        {
            return ProjectRole.Creator;
        }

        var permission = project.Permissions.FirstOrDefault(p => p.PersonKey == userId);
        if (permission is null)
        {
            return ProjectRole.Unknown;
        }

        return permission.PermissionType.ToProjectRole();
    }
}