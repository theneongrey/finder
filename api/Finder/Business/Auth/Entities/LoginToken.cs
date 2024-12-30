using Finder.Business.Shared.Entities;

namespace Finder.Business.Auth.Entities;

public class LoginToken : BaseEntity
{
    public required Guid Id { get; set; }
    public string? Token { get; set; }
    public string? Code { get; set; }
    public int Retries { get; set; }
    public string? RedirectUrl { get; set; }

    public required Person Person { get; set; }
}