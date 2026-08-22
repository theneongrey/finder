using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Finder.Business.Permission.Entities;
using Finder.Business.Project.Entities;
using Finder.Business.Shared;
using Finder.Tests.Infrastructure;
using Xunit;

namespace Finder.Tests.Projects;

public class ProjectApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public ProjectApiTests(FinderApiFactory factory) => _factory = factory;

    // --- GET /api/project — disabled, returns 410 ---

    [Fact]
    public async Task GetProjects_WhenAuthenticated_Returns410()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync("/api/project");

        Assert.Equal(HttpStatusCode.Gone, response.StatusCode);
    }

    [Fact]
    public async Task GetProjects_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/project");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- GET /api/project/{id} ---

    [Fact]
    public async Task GetProject_WhenCreator_ReturnsProject()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, "Specific Project");
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync($"/api/project/{project.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal(SlugHelper.ToSlug("Specific Project", project.Id), json["id"]!.GetValue<string>());
        Assert.Equal("Specific Project", json["name"]!.GetValue<string>());
    }

    [Fact]
    public async Task GetProject_WhenNotFound_Returns404()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync($"/api/project/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetProject_WhenNotPermitted_Returns404()
    {
        var owner = await _factory.SeedUser();
        var other = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        using var client = _factory.CreateAuthenticatedClient(other.Id);

        var response = await client.GetAsync($"/api/project/{project.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetProject_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/project/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- POST /api/project — disabled, returns 410 ---

    [Fact]
    public async Task AddProject_WhenAuthenticated_Returns410()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PostAsJsonAsync("/api/project", new { name = "New Project", description = "A description" });

        Assert.Equal(HttpStatusCode.Gone, response.StatusCode);
    }

    [Fact]
    public async Task AddProject_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/project", new { name = "New Project", description = "A description" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- PUT /api/project/{slug} — disabled, returns 410 ---

    [Fact]
    public async Task UpdateProject_WhenAuthenticated_Returns410()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, "Original Name", "Original Description");
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync($"/api/project/{project.Id}", new { name = "Updated Name", description = "Updated Description" });

        Assert.Equal(HttpStatusCode.Gone, response.StatusCode);
    }

    [Fact]
    public async Task UpdateProject_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync($"/api/project/{Guid.NewGuid()}", new { name = "Updated", description = "Updated" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- DELETE /api/project/{id} ---

    [Fact]
    public async Task DeleteProject_WhenOwner_Returns204()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.DeleteAsync($"/api/project/{project.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task DeleteProject_WhenNotOwner_Returns404()
    {
        var owner = await _factory.SeedUser();
        var other = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        using var client = _factory.CreateAuthenticatedClient(other.Id);

        var response = await client.DeleteAsync($"/api/project/{project.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteProject_WhenNotFound_Returns404()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.DeleteAsync($"/api/project/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteProject_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.DeleteAsync($"/api/project/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- GET /api/project/public/{slug} ---

    [Fact]
    public async Task GetPublicProject_WhenOpenAndUnauthenticated_Returns200()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, "Public Poll", visibilityType: VisibilityType.VisibleForEverbody);
        using var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/project/public/{project.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal(SlugHelper.ToSlug("Public Poll", project.Id), json["projectId"]!.GetValue<string>());
    }

    [Fact]
    public async Task GetPublicProject_WhenNotOpen_AndUnauthenticated_Returns403()
    {
        var owner = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id, visibilityType: VisibilityType.VisibleForSelectedOnly);
        using var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/project/public/{project.Id}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetPublicProject_WhenNotOpen_AndIsOwner_Returns200()
    {
        var owner = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id, visibilityType: VisibilityType.VisibleForSelectedOnly);
        using var client = _factory.CreateAuthenticatedClient(owner.Id);

        var response = await client.GetAsync($"/api/project/public/{project.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetPublicProject_WhenNotOpen_AndHasPermission_Returns200()
    {
        var owner = await _factory.SeedUser();
        var member = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id, visibilityType: VisibilityType.VisibleForSelectedOnly);
        await _factory.SeedPermission(project.Id, member.Id, PermissionType.Voter);
        using var client = _factory.CreateAuthenticatedClient(member.Id);

        var response = await client.GetAsync($"/api/project/public/{project.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetPublicProject_WhenNotOpen_AndNoPermission_Returns403()
    {
        var owner = await _factory.SeedUser();
        var stranger = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id, visibilityType: VisibilityType.VisibleForSelectedOnly);
        using var client = _factory.CreateAuthenticatedClient(stranger.Id);

        var response = await client.GetAsync($"/api/project/public/{project.Id}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // --- GET /api/project/standalone-polls ---

    [Fact]
    public async Task GetStandalonePolls_WhenAuthenticated_ReturnsOwnStandalonePolls()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, "My Standalone Poll", isStandalone: true);
        await _factory.SeedPoll(project.Id, "My Standalone Poll");
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync("/api/project/standalone-polls");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var polls = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsArray();
        Assert.Contains(polls, p => p!["name"]!.GetValue<string>() == "My Standalone Poll");
    }

    [Fact]
    public async Task GetStandalonePolls_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/project/standalone-polls");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- POST /api/project/standalone-poll ---

    [Fact]
    public async Task CreateStandalonePoll_WhenValid_Returns200()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PostAsJsonAsync("/api/project/standalone-poll",
            new { name = "New Standalone Poll", description = "A description", optionType = (int)OptionType.YesNo });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal("New Standalone Poll", json["name"]!.GetValue<string>());
        Assert.NotEmpty(json["projectId"]!.GetValue<string>());
        Assert.NotEmpty(json["pollId"]!.GetValue<string>());
    }

    [Fact]
    public async Task CreateStandalonePoll_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/project/standalone-poll",
            new { name = "New Standalone Poll", description = "A description", optionType = (int)OptionType.YesNo });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
