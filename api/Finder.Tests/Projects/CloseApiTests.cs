using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Finder.Business.Permission.Entities;
using Finder.Tests.Infrastructure;
using Xunit;

namespace Finder.Tests.Projects;

public class CloseApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public CloseApiTests(FinderApiFactory factory) => _factory = factory;

    // --- closeDate in create/update ---

    [Fact]
    public async Task CreateStandalonePoll_WithFutureCloseDate_ReturnsIsClosedFalse()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);
        var closeDate = DateTime.UtcNow.AddDays(1);

        var response = await client.PostAsJsonAsync("/api/project/standalone-poll", new
        {
            name = "Test Poll",
            description = "desc",
            optionType = 0,
            closeDate
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.False(json["isClosed"]!.GetValue<bool>());
        Assert.NotNull(json["closeDate"]);
    }

    [Fact]
    public async Task CreateStandalonePoll_WithPastCloseDate_Returns400()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);
        var closeDate = DateTime.UtcNow.AddDays(-1);

        var response = await client.PostAsJsonAsync("/api/project/standalone-poll", new
        {
            name = "Test Poll",
            description = "desc",
            optionType = 0,
            closeDate
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateStandalonePoll_WithoutCloseDate_ReturnsNullCloseDateAndIsClosedFalse()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PostAsJsonAsync("/api/project/standalone-poll", new
        {
            name = "Test Poll",
            description = "desc",
            optionType = 0
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.False(json["isClosed"]!.GetValue<bool>());
        Assert.Null(json["closeDate"]);
    }

    [Fact]
    public async Task GetStandalonePolls_PollWithPastCloseDate_ReturnsIsClosedTrue()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, isStandalone: true);
        await _factory.SeedPoll(project.Id, closeDate: DateTime.UtcNow.AddDays(-1));
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync("/api/project/standalone-polls");

        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.True(json.AsArray()[0]!["isClosed"]!.GetValue<bool>());
    }

    [Fact]
    public async Task UpdatePoll_SetCloseDate_ReturnsUpdatedCloseDate()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, isStandalone: true);
        var poll = await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);
        var closeDate = DateTime.UtcNow.AddDays(2);

        var response = await client.PutAsJsonAsync($"/api/project/poll/{poll.Id}", new
        {
            name = poll.Name,
            description = poll.Description,
            closeDate
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.False(json["isClosed"]!.GetValue<bool>());
        Assert.NotNull(json["closeDate"]);
    }

    [Fact]
    public async Task UpdatePoll_ClearCloseDate_ReturnsNullCloseDate()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, isStandalone: true);
        var poll = await _factory.SeedPoll(project.Id, closeDate: DateTime.UtcNow.AddDays(1));
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync($"/api/project/poll/{poll.Id}", new
        {
            name = poll.Name,
            description = poll.Description,
            closeDate = (DateTime?)null
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Null(json["closeDate"]);
        Assert.False(json["isClosed"]!.GetValue<bool>());
    }

    // --- POST /api/polls/{slug}/close ---

    [Fact]
    public async Task ClosePoll_AsMaintainer_ReturnsIsClosedTrue()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, isStandalone: true);
        var poll = await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PostAsync($"/api/polls/{poll.Id}/close", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.True(json["isClosed"]!.GetValue<bool>());
        Assert.NotNull(json["closeDate"]);
    }

    [Fact]
    public async Task ClosePoll_WhenUnauthenticated_Returns401()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, isStandalone: true);
        var poll = await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateClient();

        var response = await client.PostAsync($"/api/polls/{poll.Id}/close", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ClosePoll_AsVoter_Returns404()
    {
        var owner = await _factory.SeedUser();
        var voter = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id, isStandalone: true);
        await _factory.SeedPermission(project.Id, voter.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateAuthenticatedClient(voter.Id);

        var response = await client.PostAsync($"/api/polls/{poll.Id}/close", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ClosePoll_AlreadyClosed_IsIdempotent()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, isStandalone: true);
        var poll = await _factory.SeedPoll(project.Id, closeDate: DateTime.UtcNow.AddDays(-1));
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PostAsync($"/api/polls/{poll.Id}/close", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.True(json["isClosed"]!.GetValue<bool>());
    }
}
