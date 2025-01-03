using Finder.Business.Auth.Entities;

namespace Finder.Business.Auth.Api.Responses;

public class PersonResponse
{
    public bool IsAuthenticated { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
}

public static class PersonMapper
{
    public static PersonResponse ToPersonResponse(this Person person, bool isAuthenticated)
    {
        return new PersonResponse
        {
            Name = person.Name,
            Email = person.Email,
            Role = Enum.GetName(person.Role),
            IsAuthenticated = isAuthenticated
        };
    }
}