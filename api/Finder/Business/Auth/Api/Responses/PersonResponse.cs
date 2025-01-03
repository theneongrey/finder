namespace Finder.Business.Auth.Api.Responses;

public class PersonResponse
{
    public bool IsAuthenticated { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
}