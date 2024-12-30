namespace Finder.Business.Auth.Api.Requests;

public class CodeLoginRequest
{
    public required string LoginCode { get; set; }
    public required string Email { get; set; }
}