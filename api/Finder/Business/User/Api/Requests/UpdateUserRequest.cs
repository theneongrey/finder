namespace Finder.Business.User.Api.Requests;

public class UpdateUserRequest
{
    public required string Name { get; set; }
    public required string Language { get; set; }
}
