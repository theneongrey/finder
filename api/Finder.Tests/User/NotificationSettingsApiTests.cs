using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Finder.Tests.Infrastructure;
using Xunit;

namespace Finder.Tests.User;

public class NotificationSettingsApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public NotificationSettingsApiTests(FinderApiFactory factory) => _factory = factory;

    // --- GET /api/user/notifications/settings ---

    [Fact]
    public async Task GetNotificationSettings_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/user/notifications/settings");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetNotificationSettings_WhenAuthenticated_Returns6Settings()
    {
        var user = await _factory.SeedUser();
        await _factory.SeedPersonNotificationSettings(user.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync("/api/user/notifications/settings");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var array = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsArray();
        Assert.Equal(6, array.Count);
    }

    [Fact]
    public async Task GetNotificationSettings_DefaultValueIsAll()
    {
        var user = await _factory.SeedUser();
        await _factory.SeedPersonNotificationSettings(user.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync("/api/user/notifications/settings");

        var array = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsArray();
        foreach (var item in array)
        {
            Assert.Equal("all", item!["value"]!.GetValue<string>());
        }
    }

    [Fact]
    public async Task GetNotificationSettings_OrderedBySortIndex()
    {
        var user = await _factory.SeedUser();
        await _factory.SeedPersonNotificationSettings(user.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync("/api/user/notifications/settings");

        var array = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsArray();
        for (var i = 0; i < array.Count; i++)
        {
            Assert.Equal(i, array[i]!["sortIndex"]!.GetValue<int>());
        }
    }

    [Fact]
    public async Task GetNotificationSettings_IncludesAllowedValues()
    {
        var user = await _factory.SeedUser();
        await _factory.SeedPersonNotificationSettings(user.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync("/api/user/notifications/settings");

        var array = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsArray();
        var allowedValues = array[0]!["allowedValues"]!.AsArray().Select(v => v!.GetValue<string>()).ToList();
        Assert.Equal(["off", "favOnly", "all"], allowedValues);
    }

    // --- PUT /api/user/notifications/settings/{id} ---

    [Fact]
    public async Task UpdateNotificationSetting_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync("/api/user/notifications/settings/1", new { value = "off" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateNotificationSetting_WithValidValue_ReturnsUpdatedSetting()
    {
        var user = await _factory.SeedUser();
        await _factory.SeedPersonNotificationSettings(user.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync("/api/user/notifications/settings/1", new { value = "off" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal(1, json["id"]!.GetValue<int>());
        Assert.Equal("off", json["value"]!.GetValue<string>());
    }

    [Fact]
    public async Task UpdateNotificationSetting_PersistsAcrossRequests()
    {
        var user = await _factory.SeedUser();
        await _factory.SeedPersonNotificationSettings(user.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        await client.PutAsJsonAsync("/api/user/notifications/settings/1", new { value = "favOnly" });
        var response = await client.GetAsync("/api/user/notifications/settings");

        var array = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsArray();
        var setting1 = array.First(n => n!["id"]!.GetValue<int>() == 1)!;
        Assert.Equal("favOnly", setting1["value"]!.GetValue<string>());
    }

    [Fact]
    public async Task UpdateNotificationSetting_WithInvalidValue_Returns400()
    {
        var user = await _factory.SeedUser();
        await _factory.SeedPersonNotificationSettings(user.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync("/api/user/notifications/settings/1", new { value = "invalid" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateNotificationSetting_WithNonExistentId_Returns404()
    {
        var user = await _factory.SeedUser();
        await _factory.SeedPersonNotificationSettings(user.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync("/api/user/notifications/settings/999", new { value = "off" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
