using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Finder.Tests.Infrastructure;
using Xunit;

namespace Finder.Tests.Projects;

public class StandalonePollOverviewApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public StandalonePollOverviewApiTests(FinderApiFactory factory) => _factory = factory;

    // --- GET /api/project/standalone-polls ---

    [Fact]
    public async Task GetStandalonePolls_WhenNoVotes_ReturnsNullLastVoteAt()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, isStandalone: true);
        await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync("/api/project/standalone-polls");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        var poll = json.AsArray()[0]!;
        Assert.Null(poll["lastVoteAt"]);
    }

    [Fact]
    public async Task GetStandalonePolls_WithOneVote_ReturnsLastVoteAt()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, isStandalone: true);
        var poll = await _factory.SeedPoll(project.Id);
        var option = await _factory.SeedOption(poll.Id);
        var vote = await _factory.SeedVote(option.Id, user.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync("/api/project/standalone-polls");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        var pollJson = json.AsArray()[0]!;
        var lastVoteAt = pollJson["lastVoteAt"]?.GetValue<DateTime>();
        Assert.NotNull(lastVoteAt);
        Assert.Equal(vote.Created, lastVoteAt.Value, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task GetStandalonePolls_WithMultipleVotes_ReturnsNewestLastVoteAt()
    {
        var user1 = await _factory.SeedUser();
        var user2 = await _factory.SeedUser();
        var project = await _factory.SeedProject(user1.Id, isStandalone: true);
        await _factory.SeedPermission(project.Id, user2.Id, Business.Permission.Entities.PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);
        var option = await _factory.SeedOption(poll.Id);
        await _factory.SeedVote(option.Id, user1.Id);
        var latestVote = await _factory.SeedVote(option.Id, user2.Id);
        using var client = _factory.CreateAuthenticatedClient(user1.Id);

        var response = await client.GetAsync("/api/project/standalone-polls");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        var pollJson = json.AsArray()[0]!;
        var lastVoteAt = pollJson["lastVoteAt"]?.GetValue<DateTime>();
        Assert.NotNull(lastVoteAt);
        Assert.Equal(latestVote.Created, lastVoteAt.Value, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task GetStandalonePolls_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/project/standalone-polls");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
