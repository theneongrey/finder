using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Finder.Tests.Infrastructure;
using Xunit;

namespace Finder.Tests.Projects;

public class ProjectApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public ProjectApiTests(FinderApiFactory factory) => _factory = factory;

    // --- GET /api/project ---

    [Fact]
    public async Task GetProjects_WhenAuthenticated_ReturnsOwnProjects()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, "My Project");
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync("/api/project");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var projects = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsArray();
        Assert.Contains(projects, p => p!["id"]!.GetValue<string>() == project.Id.ToString());
    }

    [Fact]
    public async Task GetProjects_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/project");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetProjects_DoesNotReturnOtherUsersProjects()
    {
        var user1 = await _factory.SeedUser();
        var user2 = await _factory.SeedUser();
        var otherProject = await _factory.SeedProject(user2.Id, "Other User's Project");
        using var client = _factory.CreateAuthenticatedClient(user1.Id);

        var response = await client.GetAsync("/api/project");

        var projects = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsArray();
        Assert.DoesNotContain(projects, p => p!["id"]!.GetValue<string>() == otherProject.Id.ToString());
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
        Assert.Equal(project.Id.ToString(), json["id"]!.GetValue<string>());
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

    // --- POST /api/project ---

    [Fact]
    public async Task AddProject_WhenValid_ReturnsCreatedProject()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PostAsJsonAsync("/api/project", new { name = "New Project", description = "A description" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal("New Project", json["name"]!.GetValue<string>());
        Assert.Equal("A description", json["description"]!.GetValue<string>());
        Assert.NotEmpty(json["id"]!.GetValue<string>());
    }

    [Fact]
    public async Task AddProject_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/project", new { name = "New Project", description = "A description" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- PUT /api/project/{id} ---

    [Fact]
    public async Task UpdateProject_WhenOwner_ReturnsUpdatedProject()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, "Original Name", "Original Description");
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync($"/api/project/{project.Id}", new { name = "Updated Name", description = "Updated Description" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal("Updated Name", json["name"]!.GetValue<string>());
        Assert.Equal("Updated Description", json["description"]!.GetValue<string>());
    }

    [Fact]
    public async Task UpdateProject_WhenNotOwner_Returns404()
    {
        var owner = await _factory.SeedUser();
        var other = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        using var client = _factory.CreateAuthenticatedClient(other.Id);

        var response = await client.PutAsJsonAsync($"/api/project/{project.Id}", new { name = "Hacked", description = "Hacked" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateProject_WhenNotFound_Returns404()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync($"/api/project/{Guid.NewGuid()}", new { name = "Updated", description = "Updated" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
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
}
