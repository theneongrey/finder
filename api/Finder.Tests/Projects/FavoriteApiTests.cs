using System.Net;
using System.Text.Json.Nodes;
using Finder.Business.Permission.Entities;
using Finder.Tests.Infrastructure;
using Xunit;

namespace Finder.Tests.Projects;

public class FavoriteApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public FavoriteApiTests(FinderApiFactory factory) => _factory = factory;

    // --- PATCH /api/polls/{projectSlug}/favorite ---

    [Fact]
    public async Task ToggleFavorite_WhenNotYetFavorited_ReturnsTrueAndOverviewReflectsIt()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, isStandalone: true);
        await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PatchAsync($"/api/polls/{project.Id}/favorite", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.True(json["isFavorite"]!.GetValue<bool>());

        var overviewResponse = await client.GetAsync("/api/project/standalone-polls");
        var overviewJson = JsonNode.Parse(await overviewResponse.Content.ReadAsStringAsync())!;
        Assert.True(overviewJson.AsArray()[0]!["isFavorite"]!.GetValue<bool>());
    }

    [Fact]
    public async Task ToggleFavorite_WhenAlreadyFavorited_ReturnsFalseAndOverviewReflectsIt()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, isStandalone: true);
        await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        await client.PatchAsync($"/api/polls/{project.Id}/favorite", null);
        var response = await client.PatchAsync($"/api/polls/{project.Id}/favorite", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.False(json["isFavorite"]!.GetValue<bool>());

        var overviewResponse = await client.GetAsync("/api/project/standalone-polls");
        var overviewJson = JsonNode.Parse(await overviewResponse.Content.ReadAsStringAsync())!;
        Assert.False(overviewJson.AsArray()[0]!["isFavorite"]!.GetValue<bool>());
    }

    [Fact]
    public async Task ToggleFavorite_UserAFavoritingDoesNotAffectUserB()
    {
        var userA = await _factory.SeedUser();
        var userB = await _factory.SeedUser();
        var project = await _factory.SeedProject(userA.Id, isStandalone: true);
        await _factory.SeedPermission(project.Id, userB.Id, PermissionType.Voter);
        await _factory.SeedPoll(project.Id);

        using var clientA = _factory.CreateAuthenticatedClient(userA.Id);
        await clientA.PatchAsync($"/api/polls/{project.Id}/favorite", null);

        using var clientB = _factory.CreateAuthenticatedClient(userB.Id);
        var overviewResponse = await clientB.GetAsync("/api/project/standalone-polls");
        var overviewJson = JsonNode.Parse(await overviewResponse.Content.ReadAsStringAsync())!;
        Assert.False(overviewJson.AsArray()[0]!["isFavorite"]!.GetValue<bool>());
    }

    [Fact]
    public async Task ToggleFavorite_WhenUnauthenticated_Returns401()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, isStandalone: true);
        await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateClient();

        var response = await client.PatchAsync($"/api/polls/{project.Id}/favorite", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ToggleFavorite_WhenNonMember_Returns403()
    {
        var owner = await _factory.SeedUser();
        var nonMember = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id, isStandalone: true);
        await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateAuthenticatedClient(nonMember.Id);

        var response = await client.PatchAsync($"/api/polls/{project.Id}/favorite", null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetStandalonePolls_IsFavoriteFalseByDefault()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, isStandalone: true);
        await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync("/api/project/standalone-polls");

        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.False(json.AsArray()[0]!["isFavorite"]!.GetValue<bool>());
    }
}
