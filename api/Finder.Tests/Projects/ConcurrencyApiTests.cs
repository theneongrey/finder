using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Finder.Business.Permission.Entities;
using Finder.Tests.Infrastructure;
using Xunit;

namespace Finder.Tests.Projects;

/// <summary>
/// Optimistic concurrency on option and poll edits: clients echo the version they edited and get
/// 412 when someone else changed it first. Requests without a version keep last-write-wins.
/// </summary>
public class ConcurrencyApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public ConcurrencyApiTests(FinderApiFactory factory) => _factory = factory;

    [Fact]
    public async Task UpdateOption_WithCurrentVersion_SucceedsAndBumpsVersion()
    {
        var (client, pollId, optionId) = await SetupAsync();
        var version = await GetOptionVersion(client, pollId, optionId);

        var response = await client.PutAsJsonAsync($"/api/project/poll/option/{optionId}",
            new { text = "Renamed", description = "", version });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal(version + 1, json["version"]!.GetValue<int>());
    }

    [Fact]
    public async Task UpdateOption_WithStaleVersion_Returns412AndKeepsTheOtherEdit()
    {
        var (client, pollId, optionId) = await SetupAsync();
        var staleVersion = await GetOptionVersion(client, pollId, optionId);

        // Someone else saves first.
        var first = await client.PutAsJsonAsync($"/api/project/poll/option/{optionId}",
            new { text = "Their edit", description = "", version = staleVersion });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await client.PutAsJsonAsync($"/api/project/poll/option/{optionId}",
            new { text = "My edit", description = "", version = staleVersion });

        Assert.Equal(HttpStatusCode.PreconditionFailed, second.StatusCode);
        var poll = await GetPoll(client, pollId);
        Assert.Contains(poll["options"]!.AsArray(), o => o!["text"]!.GetValue<string>() == "Their edit");
    }

    [Fact]
    public async Task UpdateOption_WithoutVersion_KeepsLastWriteWins()
    {
        var (client, _, optionId) = await SetupAsync();

        var response = await client.PutAsJsonAsync($"/api/project/poll/option/{optionId}",
            new { text = "No version", description = "" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task UpdatePoll_WithStaleVersion_Returns412()
    {
        var (client, pollId, _) = await SetupAsync();
        var version = (await GetPoll(client, pollId))["version"]!.GetValue<int>();

        var first = await client.PutAsJsonAsync($"/api/project/poll/{pollId}",
            new { name = "Their name", description = "", version });
        var second = await client.PutAsJsonAsync($"/api/project/poll/{pollId}",
            new { name = "My name", description = "", version });

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.PreconditionFailed, second.StatusCode);
        Assert.Equal(version + 1, (await GetPoll(client, pollId))["version"]!.GetValue<int>());
    }

    [Fact]
    public async Task Delta_CarriesVersions()
    {
        var (client, pollId, _) = await SetupAsync();

        var delta = JsonNode.Parse(await client.GetStringAsync($"/api/project/poll/{pollId}/delta"))!;

        Assert.NotNull(delta["poll"]!["version"]);
        Assert.NotNull(delta["options"]![0]!["version"]);
    }

    private async Task<(HttpClient Client, string PollId, string OptionId)> SetupAsync()
    {
        var owner = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        await _factory.SeedPermission(project.Id, owner.Id, PermissionType.Owner);
        var poll = await _factory.SeedPoll(project.Id);
        var option = await _factory.SeedOption(poll.Id);
        return (_factory.CreateAuthenticatedClient(owner.Id), poll.Id, option.Id);
    }

    private static async Task<JsonNode> GetPoll(HttpClient client, string pollId) =>
        JsonNode.Parse(await client.GetStringAsync($"/api/project/poll/{pollId}"))!;

    private static async Task<int> GetOptionVersion(HttpClient client, string pollId, string optionId)
    {
        var poll = await GetPoll(client, pollId);
        var option = poll["options"]!.AsArray().Single(o => o!["id"]!.GetValue<string>().EndsWith(optionId));
        return option!["version"]!.GetValue<int>();
    }
}
