namespace Finder.Business.Auth.Setup;

public class LoginOptions
{
    public required string LoginLink { get; set; }
    /// <summary>Dev only: fixed login token for TestUser accounts.</summary>
    public string? AuthToken { get; set; }
    /// <summary>Dev only: fixed 6-digit login code for TestUser accounts.</summary>
    public string? AuthCode { get; set; }
}