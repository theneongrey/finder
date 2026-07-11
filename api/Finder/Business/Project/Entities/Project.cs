using Finder.Business.Auth.Entities;
using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public enum VisibilityType
{
    VisibleForSelectedOnly,
    VisibleForEverbody
}

public class Project : BaseEntity
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public List<Poll> Polls { get; set; } = [];
    public List<Permission.Entities.Permission> Permissions { get; set; } = [];
    public required Person Creator { get; set; }
    public required VisibilityType VisibilityType { get; set; }
    public bool IsStandalone { get; set; } = false;
}