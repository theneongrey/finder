using Finder.Business.Shared.Entities;

namespace Finder.Business.Auth.Entities;

public class Person : BaseEntity
{
    public required Guid Id { get; set; }
    public required string Email { get; set; }
    public string? Name { get; set; }
    public bool HasLoggedIn { get; set; }
}