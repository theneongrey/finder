namespace Finder.Business.Auth.Setup;

public class LoginOptions
{
    public required string Subject { get; set; }
    public required string SubjectNew { get; set; }
    public required string LoginLink { get; set; }
    public string? AuthToken { get; set; }
}