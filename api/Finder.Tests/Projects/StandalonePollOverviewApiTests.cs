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

    // --- Voting progress fields ---

    [Fact]
    public async Task GetStandalonePolls_WhenNoVotes_ReturnsZeroVotedCountAndFalseCurrentUserVoted()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id, isStandalone: true);
        await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync("/api/project/standalone-polls");

        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        var poll = json.AsArray()[0]!;
        Assert.Equal(0, poll["votedCount"]!.GetValue<int>());
        Assert.False(poll["currentUserVoted"]!.GetValue<bool>());
    }

    [Fact]
    public async Task GetStandalonePolls_AfterUserAVotes_IncrementsVotedCountAndSetsCurrentUserVotedForA()
    {
        var userA = await _factory.SeedUser();
        var userB = await _factory.SeedUser();
        var project = await _factory.SeedProject(userA.Id, isStandalone: true);
        await _factory.SeedPermission(project.Id, userB.Id, Business.Permission.Entities.PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);
        var option = await _factory.SeedOption(poll.Id);
        await _factory.SeedVote(option.Id, userA.Id);

        using var clientA = _factory.CreateAuthenticatedClient(userA.Id);
        var responseA = await clientA.GetAsync("/api/project/standalone-polls");
        var pollA = JsonNode.Parse(await responseA.Content.ReadAsStringAsync())!.AsArray()[0]!;
        Assert.Equal(1, pollA["votedCount"]!.GetValue<int>());
        Assert.True(pollA["currentUserVoted"]!.GetValue<bool>());

        using var clientB = _factory.CreateAuthenticatedClient(userB.Id);
        var responseB = await clientB.GetAsync("/api/project/standalone-polls");
        var pollB = JsonNode.Parse(await responseB.Content.ReadAsStringAsync())!.AsArray()[0]!;
        Assert.Equal(1, pollB["votedCount"]!.GetValue<int>());
        Assert.False(pollB["currentUserVoted"]!.GetValue<bool>());
    }

    [Fact]
    public async Task GetStandalonePolls_WhenAllParticipantsVoted_VotedCountEqualsTotalParticipants()
    {
        var user1 = await _factory.SeedUser();
        var user2 = await _factory.SeedUser();
        var project = await _factory.SeedProject(user1.Id, isStandalone: true);
        await _factory.SeedPermission(project.Id, user2.Id, Business.Permission.Entities.PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);
        var option = await _factory.SeedOption(poll.Id);
        await _factory.SeedVote(option.Id, user1.Id);
        await _factory.SeedVote(option.Id, user2.Id);
        using var client = _factory.CreateAuthenticatedClient(user1.Id);

        var response = await client.GetAsync("/api/project/standalone-polls");

        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        var pollJson = json.AsArray()[0]!;
        var votedCount = pollJson["votedCount"]!.GetValue<int>();
        var totalParticipants = pollJson["totalParticipants"]!.GetValue<int>();
        Assert.Equal(totalParticipants, votedCount);
    }

    [Fact]
    public async Task GetStandalonePolls_TotalParticipantsIncludesCreatorAndPermissionHolders()
    {
        var creator = await _factory.SeedUser();
        var voter1 = await _factory.SeedUser();
        var voter2 = await _factory.SeedUser();
        var project = await _factory.SeedProject(creator.Id, isStandalone: true);
        await _factory.SeedPermission(project.Id, voter1.Id, Business.Permission.Entities.PermissionType.Voter);
        await _factory.SeedPermission(project.Id, voter2.Id, Business.Permission.Entities.PermissionType.Voter);
        await _factory.SeedPoll(project.Id);
        using var client = _factory.CreateAuthenticatedClient(creator.Id);

        var response = await client.GetAsync("/api/project/standalone-polls");

        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        var pollJson = json.AsArray()[0]!;
        Assert.Equal(3, pollJson["totalParticipants"]!.GetValue<int>());
    }
}
