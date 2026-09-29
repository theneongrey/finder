using Finder.Business.Shared.Entities;

namespace Finder.Business.Auth.Entities;

public enum Role
{
    Admin,
    Upgraded,
    Free,
    TestUser
}

public class Person : BaseEntity
{
    public required Guid Id { get; set; }
    public required string Email { get; set; }
    public string? Name { get; set; }
    public string? Picture { get; set; }
    public bool HasLoggedIn { get; set; }
    public required Role Role { get; set; }
    public string Language { get; set; } = "en";

    /// <summary>Blocked people can't log in; an existing session is rejected on its next request.</summary>
    public bool IsBlocked { get; set; }
    public DateTime? BlockedAt { get; set; }

    public List<Permission.Entities.Permission> Permissions { get; set; } = [];
}