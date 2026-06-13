using Finder.Business.Auth.Entities;

namespace Finder.Business.Permission.Api.Responses;

public class InvitedPersonResponse
{
    public required string Email { get; set; }
    public required DateTime Created { get; set; }
}

public static class InvitedPersonMapper
{
    public static InvitedPersonResponse ToInvitedPersonResponse(this Person person)
    {
        return new InvitedPersonResponse
        {
            Email = person.Email,
            Created = person.Created
        };
    }
}
