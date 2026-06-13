using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Finder.Business.Project.Entities;
using Finder.Tests.Infrastructure;
using Xunit;

namespace Finder.Tests.Projects;

public class TopicApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public TopicApiTests(FinderApiFactory factory) => _factory = factory;

    // --- POST /api/project/topic ---

    [Fact]
    public async Task AddTopic_WhenCreator_ReturnsTopic()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PostAsJsonAsync("/api/project/topic",
            new { projectId = project.Id, name = "My Topic", optionType = (int)OptionType.YesNo });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal("My Topic", json["name"]!.GetValue<string>());
        Assert.NotEmpty(json["id"]!.GetValue<string>());
    }

    [Fact]
    public async Task AddTopic_WhenProjectNotFound_ReturnsBadRequest()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PostAsJsonAsync("/api/project/topic",
            new { projectId = Guid.NewGuid(), name = "My Topic", optionType = (int)OptionType.YesNo });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddTopic_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/project/topic",
            new { projectId = Guid.NewGuid(), name = "My Topic", optionType = (int)OptionType.YesNo });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- GET /api/project/topic/{id} ---

    [Fact]
    public async Task GetTopic_WhenCreator_ReturnsTopic()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var topic = await _factory.SeedTopic(project.Id, "Visible Topic");
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync($"/api/project/topic/{topic.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal(topic.Id.ToString(), json["id"]!.GetValue<string>());
        Assert.Equal("Visible Topic", json["name"]!.GetValue<string>());
    }

    [Fact]
    public async Task GetTopic_WhenNotFound_Returns404()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync($"/api/project/topic/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetTopic_WhenNotPermitted_Returns404()
    {
        var owner = await _factory.SeedUser();
        var other = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        var topic = await _factory.SeedTopic(project.Id);
        using var client = _factory.CreateAuthenticatedClient(other.Id);

        var response = await client.GetAsync($"/api/project/topic/{topic.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetTopic_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync($"/api/project/topic/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- DELETE /api/project/topic/{id} ---

    [Fact]
    public async Task DeleteTopic_WhenCreator_Returns204()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var topic = await _factory.SeedTopic(project.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.DeleteAsync($"/api/project/topic/{topic.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task DeleteTopic_WhenNotPermitted_Returns404()
    {
        var owner = await _factory.SeedUser();
        var other = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        var topic = await _factory.SeedTopic(project.Id);
        using var client = _factory.CreateAuthenticatedClient(other.Id);

        var response = await client.DeleteAsync($"/api/project/topic/{topic.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteTopic_WhenNotFound_Returns404()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.DeleteAsync($"/api/project/topic/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteTopic_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.DeleteAsync($"/api/project/topic/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- POST /api/project/topic/option ---

    [Fact]
    public async Task AddOption_WhenCreator_ReturnsOption()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var topic = await _factory.SeedTopic(project.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PostAsJsonAsync("/api/project/topic/option",
            new { topicId = topic.Id, text = "Option A" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal("Option A", json["text"]!.GetValue<string>());
        Assert.NotEmpty(json["id"]!.GetValue<string>());
    }

    [Fact]
    public async Task AddOption_WhenTopicNotFound_ReturnsBadRequest()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PostAsJsonAsync("/api/project/topic/option",
            new { topicId = Guid.NewGuid(), text = "Option A" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddOption_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/project/topic/option",
            new { topicId = Guid.NewGuid(), text = "Option A" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- DELETE /api/project/topic/option/{id} ---

    [Fact]
    public async Task DeleteOption_WhenCreator_Returns204()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var topic = await _factory.SeedTopic(project.Id);
        var option = await _factory.SeedOption(topic.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.DeleteAsync($"/api/project/topic/option/{option.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task DeleteOption_WhenNotPermitted_Returns404()
    {
        var owner = await _factory.SeedUser();
        var other = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        var topic = await _factory.SeedTopic(project.Id);
        var option = await _factory.SeedOption(topic.Id);
        using var client = _factory.CreateAuthenticatedClient(other.Id);

        var response = await client.DeleteAsync($"/api/project/topic/option/{option.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteOption_WhenNotFound_Returns404()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.DeleteAsync($"/api/project/topic/option/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteOption_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.DeleteAsync($"/api/project/topic/option/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- PUT /api/project/topic/vote/{optionId} ---

    [Fact]
    public async Task Vote_WhenCreator_Returns204()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var topic = await _factory.SeedTopic(project.Id);
        var option = await _factory.SeedOption(topic.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync($"/api/project/topic/vote/{option.Id}",
            new { choice = "yes" });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Vote_WhenOptionNotFound_Returns404()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync($"/api/project/topic/vote/{Guid.NewGuid()}",
            new { choice = "yes" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Vote_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync($"/api/project/topic/vote/{Guid.NewGuid()}",
            new { choice = "yes" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
