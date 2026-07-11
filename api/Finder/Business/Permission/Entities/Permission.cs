using Finder.Business.Auth.Entities;

namespace Finder.Business.Permission.Entities;

public enum PermissionType
{
    Voter,
    Maintainer,
    Owner,
}

public class Permission
{
    public Person Person { get; set; } = null!;
    public Project.Entities.Project Project { get; set; } = null!;
    
    public Guid PersonKey { get; set; }
    
    public string ProjectKey { get; set; } = string.Empty;
    
    public PermissionType PermissionType { get; set; }
}