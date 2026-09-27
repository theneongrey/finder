using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Finder.Business.Project.Entities;
using Finder.Tests.Infrastructure;
using Xunit;

namespace Finder.Tests.Projects;

public class PollDeltaApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public PollDeltaApiTests(FinderApiFactory factory) => _factory = factory;

    private static string DeltaUrl(string pollId, DateTime? since) =>
        since is null
            ? $"/api/project/poll/{pollId}/delta"
            : $"/api/project/poll/{pollId}/delta?since={Uri.EscapeDataString(since.Value.ToString("o"))}";

    [Fact]
    public async Task GetDelta_ReturnsOnlyRowsChangedSinceToken_AndCurrentIds()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var poll = await _factory.SeedPoll(project.Id);
        var opt1 = await _factory.SeedOption(poll.Id, "Option 1");
        var opt2 = await _factory.SeedOption(poll.Id, "Option 2");
        await _factory.BackdatePollActivityAsync(poll.Id, DateTime.UtcNow.AddHours(-1));
        var since = DateTime.UtcNow.AddMinutes(-30);

        using var client = _factory.CreateAuthenticatedClient(user.Id);
        var update = await client.PutAsJsonAsync($"/api/project/poll/option/{opt1.Id}",
            new { text = "Option 1 edited", description = "" });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var response = await client.GetAsync(DeltaUrl(poll.Id, since));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;

        var options = json["options"]!.AsArray();
        Assert.Single(options);
        Assert.EndsWith(opt1.Id, options[0]!["id"]!.GetValue<string>());

        var currentIds = json["currentOptionIds"]!.AsArray().Select(n => n!.GetValue<string>()).ToList();
        Assert.Equal(2, currentIds.Count);
        Assert.Contains(currentIds, id => id.EndsWith(opt1.Id));
        Assert.Contains(currentIds, id => id.EndsWith(opt2.Id));

        Assert.True(json["syncToken"]!.GetValue<DateTime>() >= since);
    }

    [Fact]
    public async Task GetDelta_VoteChange_ResendsOptionWithNewVote()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var poll = await _factory.SeedPoll(project.Id);
        var option = await _factory.SeedOption(poll.Id, "Option 1");
        await _factory.BackdatePollActivityAsync(poll.Id, DateTime.UtcNow.AddHours(-1));
        var since = DateTime.UtcNow.AddMinutes(-30);

        using var client = _factory.CreateAuthenticatedClient(user.Id);
        var vote = await client.PutAsJsonAsync($"/api/project/poll/vote/{option.Id}", new { choice = "yes" });
        Assert.Equal(HttpStatusCode.NoContent, vote.StatusCode);

        var response = await client.GetAsync(DeltaUrl(poll.Id, since));

        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        var options = json["options"]!.AsArray();
        Assert.Single(options);
        Assert.EndsWith(option.Id, options[0]!["id"]!.GetValue<string>());
        Assert.Single(options[0]!["votes"]!.AsArray());
    }

    [Fact]
    public async Task GetDelta_DeletedOption_AbsentFromCurrentIds()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var poll = await _factory.SeedPoll(project.Id);
        var opt1 = await _factory.SeedOption(poll.Id, "Option 1");
        var opt2 = await _factory.SeedOption(poll.Id, "Option 2");
        var since = DateTime.UtcNow.AddHours(-1);

        using var client = _factory.CreateAuthenticatedClient(user.Id);
        var delete = await client.DeleteAsync($"/api/project/poll/option/{opt1.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);

        var response = await client.GetAsync(DeltaUrl(poll.Id, since));

        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        var currentIds = json["currentOptionIds"]!.AsArray().Select(n => n!.GetValue<string>()).ToList();
        Assert.Single(currentIds);
        Assert.EndsWith(opt2.Id, currentIds[0]);
        Assert.DoesNotContain(currentIds, id => id.EndsWith(opt1.Id));
    }

    [Fact]
    public async Task GetDelta_PollFieldChange_IncludesPollBlock()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var poll = await _factory.SeedPoll(project.Id, "Original name");
        await _factory.BackdatePollActivityAsync(poll.Id, DateTime.UtcNow.AddHours(-1));
        var since = DateTime.UtcNow.AddMinutes(-30);

        using var client = _factory.CreateAuthenticatedClient(user.Id);
        var update = await client.PutAsJsonAsync($"/api/project/poll/{poll.Id}",
            new { name = "New name", description = "New description" });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        var response = await client.GetAsync(DeltaUrl(poll.Id, since));

        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.NotNull(json["poll"]);
        Assert.Equal("New name", json["poll"]!["name"]!.GetValue<string>());
    }

    [Fact]
    public async Task GetDelta_WhenOnlyOptionChanged_PollBlockIsNull()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var poll = await _factory.SeedPoll(project.Id);
        var option = await _factory.SeedOption(poll.Id, "Option 1");
        await _factory.BackdatePollActivityAsync(poll.Id, DateTime.UtcNow.AddHours(-1));
        var since = DateTime.UtcNow.AddMinutes(-30);

        using var client = _factory.CreateAuthenticatedClient(user.Id);
        await client.PutAsJsonAsync($"/api/project/poll/option/{option.Id}",
            new { text = "Option 1 edited", description = "" });

        var response = await client.GetAsync(DeltaUrl(poll.Id, since));

        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Null(json["poll"]);
        Assert.Single(json["options"]!.AsArray());
    }

    [Fact]
    public async Task GetDelta_AddedComment_AppearsInDelta()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var poll = await _factory.SeedPoll(project.Id);
        await _factory.BackdatePollActivityAsync(poll.Id, DateTime.UtcNow.AddHours(-1));
        var since = DateTime.UtcNow.AddMinutes(-30);

        using var client = _factory.CreateAuthenticatedClient(user.Id);
        var comment = await client.PostAsJsonAsync("/api/project/poll/comment",
            new { pollId = poll.Id, content = "Hello there" });
        Assert.Equal(HttpStatusCode.OK, comment.StatusCode);

        var response = await client.GetAsync(DeltaUrl(poll.Id, since));

        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        var comments = json["comments"]!.AsArray();
        Assert.Single(comments);
        Assert.Equal("Hello there", comments[0]!["content"]!.GetValue<string>());
        Assert.Single(json["currentCommentIds"]!.AsArray());
    }

    [Fact]
    public async Task GetDelta_WithoutSince_ReturnsAllCurrent()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        var poll = await _factory.SeedPoll(project.Id);
        await _factory.SeedOption(poll.Id, "Option 1");
        await _factory.SeedOption(poll.Id, "Option 2");

        using var client = _factory.CreateAuthenticatedClient(user.Id);
        var response = await client.GetAsync(DeltaUrl(poll.Id, null));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.Equal(2, json["options"]!.AsArray().Count);
        Assert.Equal(2, json["currentOptionIds"]!.AsArray().Count);
    }

    [Fact]
    public async Task GetDelta_WhenNoAccess_Returns404()
    {
        var owner = await _factory.SeedUser();
        var outsider = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id, visibilityType: VisibilityType.VisibleForSelectedOnly);
        var poll = await _factory.SeedPoll(project.Id);

        using var client = _factory.CreateAuthenticatedClient(outsider.Id);
        var response = await client.GetAsync(DeltaUrl(poll.Id, DateTime.UtcNow.AddHours(-1)));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetDelta_WhenUnauthenticated_Returns401()
    {
        var owner = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        var poll = await _factory.SeedPoll(project.Id);

        using var client = _factory.CreateClient();
        var response = await client.GetAsync(DeltaUrl(poll.Id, DateTime.UtcNow.AddHours(-1)));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
