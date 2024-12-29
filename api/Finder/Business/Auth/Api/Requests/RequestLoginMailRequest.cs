namespace Finder.Business.Auth.Api.Requests;

public class RequestLoginMailRequest
{
    public required string Email { get; set; }
    public string? RedirectUrl { get; set; }
}