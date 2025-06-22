using Finder.Business.Permission.Entities;
using Finder.Business.Project.Api.Responses;

namespace Finder.Business.Permission.Api.Responses;

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

    public static ProjectRole GetRole(this Project.Entities.Project project, Guid? userId)
    {
        ProjectRole result;
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
    
    public static ProjectSharedWith ToProjectSharedWith(this Permission.Entities.Permission permission)
    {
        return new ProjectSharedWith
        {
            Name = permission.Person.Name ?? permission.Person.Email,
            Role = permission.PermissionType.ToProjectRole()
        };
    }
}