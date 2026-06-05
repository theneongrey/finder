using Finder.Business.Auth.Entities;
using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public enum VisibilityType
{
    SelectedOnly,
    Open
}

public class Project : BaseEntity
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public List<Topic> Topics { get; set; } = [];
    public List<Permission.Entities.Permission> Permissions { get; set; } = [];
    public required Person Creator { get; set; }
    public required VisibilityType VisibilityType { get; set; }
}