using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Finder.Business.Permission.Entities;
using Finder.Business.Project.Entities;
using Finder.Tests.Infrastructure;
using Xunit;

namespace Finder.Tests.Projects;

public class PollApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public PollApiTests(FinderApiFactory factory) => _factory = factory;

    // --- POST /api/project/poll ---

    [Fact]
    public async Task AddPoll_WhenCreator_ReturnsPoll()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PostAsJsonAsync("/api/project/poll",
            new { projectId = project.Id, name = "My Poll", optionType = (int)OptionType.YesNo });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal("My Poll", json["name"]!.GetValue<string>());
        Assert.NotEmpty(json["id"]!.GetValue<string>());
    }

    [Fact]
    public async Task AddPoll_WhenProjectNotFound_ReturnsBadRequest()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PostAsJsonAsync("/api/project/poll",
            new { projectId = Guid.NewGuid(), name = "My Poll", optionType = (int)OptionType.YesNo });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddPoll_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/project/poll",
            new { projectId = Guid.NewGuid(), name = "My Poll", optionType = (int)OptionType.YesNo });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- GET /api/project/poll/{id} ---

    [Fact]
    public async Task GetPoll_WhenCreator_ReturnsPoll()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var poll = await _factory.SeedPoll(project.Id, "Visible Poll");
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync($"/api/project/poll/{poll.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal(poll.Id.ToString(), json["id"]!.GetValue<string>());
        Assert.Equal("Visible Poll", json["name"]!.GetValue<string>());
    }

    [Fact]
    public async Task GetPoll_WhenNotFound_Returns404()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync($"/api/project/poll/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetPoll_WhenNotPermitted_Returns404()
    {
        var owner = await _factory.SeedUser();
        var other = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        var poll = await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateAuthenticatedClient(other.Id);

        var response = await client.GetAsync($"/api/project/poll/{poll.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetPoll_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/project/poll/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- PUT /api/project/poll/{id} ---

    [Fact]
    public async Task UpdatePoll_WhenCreator_ReturnsUpdatedPoll()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var poll = await _factory.SeedPoll(project.Id, "Original Name");
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync($"/api/project/poll/{poll.Id}", new { name = "Updated Name" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal(poll.Id.ToString(), json["id"]!.GetValue<string>());
        Assert.Equal("Updated Name", json["name"]!.GetValue<string>());
    }

    [Fact]
    public async Task UpdatePoll_WhenNotPermitted_Returns404()
    {
        var owner = await _factory.SeedUser();
        var other = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        var poll = await _factory.SeedPoll(project.Id);
        await _factory.SeedPermission(project.Id, other.Id, PermissionType.Voter);
        using var client = _factory.CreateAuthenticatedClient(other.Id);

        var response = await client.PutAsJsonAsync($"/api/project/poll/{poll.Id}", new { name = "Hacked" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdatePoll_WhenNotFound_Returns404()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync($"/api/project/poll/{Guid.NewGuid()}", new { name = "Updated" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdatePoll_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync($"/api/project/poll/{Guid.NewGuid()}", new { name = "Updated" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- DELETE /api/project/poll/{id} ---

    [Fact]
    public async Task DeletePoll_WhenCreator_Returns204()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var poll = await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.DeleteAsync($"/api/project/poll/{poll.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task DeletePoll_WhenNotPermitted_Returns404()
    {
        var owner = await _factory.SeedUser();
        var other = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        var poll = await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateAuthenticatedClient(other.Id);

        var response = await client.DeleteAsync($"/api/project/poll/{poll.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeletePoll_WhenNotFound_Returns404()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.DeleteAsync($"/api/project/poll/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeletePoll_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.DeleteAsync($"/api/project/poll/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- POST /api/project/poll/option ---

    [Fact]
    public async Task AddOption_WhenCreator_ReturnsOption()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var poll = await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PostAsJsonAsync("/api/project/poll/option",
            new { pollId = poll.Id, text = "Option A" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal("Option A", json["text"]!.GetValue<string>());
        Assert.NotEmpty(json["id"]!.GetValue<string>());
    }

    [Fact]
    public async Task AddOption_WhenPollNotFound_ReturnsBadRequest()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PostAsJsonAsync("/api/project/poll/option",
            new { pollId = Guid.NewGuid(), text = "Option A" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddOption_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/project/poll/option",
            new { pollId = Guid.NewGuid(), text = "Option A" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- PUT /api/project/poll/option/{id} ---

    [Fact]
    public async Task UpdateOption_WhenCreator_ReturnsUpdatedOption()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var poll = await _factory.SeedPoll(project.Id);
        var option = await _factory.SeedOption(poll.Id, "Original Text");
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync($"/api/project/poll/option/{option.Id}", new { text = "Updated Text" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal(option.Id.ToString(), json["id"]!.GetValue<string>());
        Assert.Equal("Updated Text", json["text"]!.GetValue<string>());
    }

    [Fact]
    public async Task UpdateOption_WhenNotPermitted_Returns404()
    {
        var owner = await _factory.SeedUser();
        var other = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        var poll = await _factory.SeedPoll(project.Id);
        var option = await _factory.SeedOption(poll.Id);
        await _factory.SeedPermission(project.Id, other.Id, PermissionType.Voter);
        using var client = _factory.CreateAuthenticatedClient(other.Id);

        var response = await client.PutAsJsonAsync($"/api/project/poll/option/{option.Id}", new { text = "Hacked" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateOption_WhenNotFound_Returns404()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync($"/api/project/poll/option/{Guid.NewGuid()}", new { text = "Updated" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateOption_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync($"/api/project/poll/option/{Guid.NewGuid()}", new { text = "Updated" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- DELETE /api/project/poll/option/{id} ---

    [Fact]
    public async Task DeleteOption_WhenCreator_Returns204()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var poll = await _factory.SeedPoll(project.Id);
        var option = await _factory.SeedOption(poll.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.DeleteAsync($"/api/project/poll/option/{option.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task DeleteOption_WhenNotPermitted_Returns404()
    {
        var owner = await _factory.SeedUser();
        var other = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        var poll = await _factory.SeedPoll(project.Id);
        var option = await _factory.SeedOption(poll.Id);
        using var client = _factory.CreateAuthenticatedClient(other.Id);

        var response = await client.DeleteAsync($"/api/project/poll/option/{option.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteOption_WhenNotFound_Returns404()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.DeleteAsync($"/api/project/poll/option/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteOption_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.DeleteAsync($"/api/project/poll/option/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- PUT /api/project/poll/vote/{optionId} ---

    [Fact]
    public async Task Vote_WhenCreator_Returns204()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var poll = await _factory.SeedPoll(project.Id);
        var option = await _factory.SeedOption(poll.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync($"/api/project/poll/vote/{option.Id}",
            new { choice = "yes" });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Vote_WhenOptionNotFound_Returns404()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync($"/api/project/poll/vote/{Guid.NewGuid()}",
            new { choice = "yes" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Vote_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync($"/api/project/poll/vote/{Guid.NewGuid()}",
            new { choice = "yes" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
