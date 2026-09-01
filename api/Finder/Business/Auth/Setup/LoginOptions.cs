namespace Finder.Business.Auth.Setup;

public class LoginOptions
{
    public required string LoginLink { get; set; }
    public string? AuthToken { get; set; }
}