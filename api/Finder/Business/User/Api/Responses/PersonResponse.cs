using Finder.Business.Auth.Entities;

namespace Finder.Business.User.Api.Responses;

public class PersonResponse
{
    public bool IsAuthenticated { get; set; }
    /// <summary>The current user's id — lets the client match its own presence entry and drop
    /// self-originated poll-change pings.</summary>
    public string? Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
    public string? Language { get; set; }
}

public static class PersonMapper
{
    public static PersonResponse ToPersonResponse(this Person person, bool isAuthenticated)
    {
        return new PersonResponse
        {
            Id = person.Id.ToString(),
            Name = person.Name,
            Email = person.Email,
            Role = Enum.GetName(person.Role),
            Language = person.Language,
            IsAuthenticated = isAuthenticated
        };
    }
}
