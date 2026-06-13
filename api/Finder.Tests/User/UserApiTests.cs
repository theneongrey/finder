using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Finder.Tests.Infrastructure;
using Xunit;

namespace Finder.Tests.User;

public class UserApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public UserApiTests(FinderApiFactory factory) => _factory = factory;

    // --- PUT /api/user ---

    [Fact]
    public async Task UpdateProfile_WhenAuthenticated_ReturnsUpdatedPerson()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync("/api/user", new { name = "Alice", language = "de" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal("Alice", json["name"]!.GetValue<string>());
        Assert.Equal("de", json["language"]!.GetValue<string>());
    }

    [Fact]
    public async Task UpdateProfile_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync("/api/user", new { name = "Alice", language = "de" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
