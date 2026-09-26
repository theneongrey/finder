using System.Diagnostics;
using System.Net.Http.Json;
using Finder.Business.Permission.Entities;
using Finder.Business.Project.Entities;
using Finder.Business.Project.RealTime;
using Finder.Tests.Infrastructure;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Xunit;

namespace Finder.Tests.Projects;

public class PollHubTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public PollHubTests(FinderApiFactory factory) => _factory = factory;

    // LongPolling drives the whole handshake through the TestServer's HTTP handler, so the
    // header-based TestAuthHandler authenticates the connection. Presence, grouping and the
    // auth predicate are transport-independent, so this exercises the hub end to end without
    // the extra WebSocket plumbing an in-memory server would need.
    private HubConnection CreateHubConnection(Guid? userId)
    {
        return new HubConnectionBuilder()
            .WithUrl("http://localhost/hub/poll", options =>
            {
                options.Transports = HttpTransportType.LongPolling;
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
                if (userId.HasValue)
                {
                    options.Headers.Add(TestAuthHandler.UserIdHeader, userId.Value.ToString());
                }
            })
            .Build();
    }

    private static async Task WaitForAsync(Func<bool> condition, int timeoutMs = 5000)
    {
        var sw = Stopwatch.StartNew();
        while (!condition() && sw.ElapsedMilliseconds < timeoutMs)
        {
            await Task.Delay(25);
        }

        Assert.True(condition(), "Condition was not met within the timeout.");
    }

    [Fact]
    public async Task JoinPoll_TwoSessions_EachReceivesRosterIncludingOther()
    {
        var userA = await _factory.SeedUser();
        var userB = await _factory.SeedUser();
        var project = await _factory.SeedProject(userA.Id);
        await _factory.SeedPermission(project.Id, userB.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);

        List<PollParticipant>? rosterA = null;
        List<PollParticipant>? rosterB = null;

        await using var connA = CreateHubConnection(userA.Id);
        await using var connB = CreateHubConnection(userB.Id);
        connA.On<List<PollParticipant>>(PollHub.PresenceChanged, r => rosterA = r);
        connB.On<List<PollParticipant>>(PollHub.PresenceChanged, r => rosterB = r);

        await connA.StartAsync();
        await connB.StartAsync();

        await connA.InvokeAsync("JoinPoll", poll.Id);
        await WaitForAsync(() => rosterA?.Count == 1);

        await connB.InvokeAsync("JoinPoll", poll.Id);
        await WaitForAsync(() => rosterA?.Count == 2);
        await WaitForAsync(() => rosterB?.Count == 2);

        Assert.Contains(rosterA!, p => p.UserId == userA.Id);
        Assert.Contains(rosterA!, p => p.UserId == userB.Id);
        Assert.Contains(rosterB!, p => p.UserId == userA.Id);
        Assert.Contains(rosterB!, p => p.UserId == userB.Id);
    }

    [Fact]
    public async Task LeavePoll_UpdatesRosterForRemainingSessions()
    {
        var userA = await _factory.SeedUser();
        var userB = await _factory.SeedUser();
        var project = await _factory.SeedProject(userA.Id);
        await _factory.SeedPermission(project.Id, userB.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);

        List<PollParticipant>? rosterA = null;

        await using var connA = CreateHubConnection(userA.Id);
        await using var connB = CreateHubConnection(userB.Id);
        connA.On<List<PollParticipant>>(PollHub.PresenceChanged, r => rosterA = r);

        await connA.StartAsync();
        await connB.StartAsync();
        await connA.InvokeAsync("JoinPoll", poll.Id);
        await connB.InvokeAsync("JoinPoll", poll.Id);
        await WaitForAsync(() => rosterA?.Count == 2);

        await connB.InvokeAsync("LeavePoll", poll.Id);
        await WaitForAsync(() => rosterA?.Count == 1);

        Assert.Contains(rosterA!, p => p.UserId == userA.Id);
        Assert.DoesNotContain(rosterA!, p => p.UserId == userB.Id);
    }

    [Fact]
    public async Task Disconnect_UpdatesRosterForRemainingSessions()
    {
        var userA = await _factory.SeedUser();
        var userB = await _factory.SeedUser();
        var project = await _factory.SeedProject(userA.Id);
        await _factory.SeedPermission(project.Id, userB.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);

        List<PollParticipant>? rosterA = null;

        await using var connA = CreateHubConnection(userA.Id);
        var connB = CreateHubConnection(userB.Id);
        connA.On<List<PollParticipant>>(PollHub.PresenceChanged, r => rosterA = r);

        await connA.StartAsync();
        await connB.StartAsync();
        await connA.InvokeAsync("JoinPoll", poll.Id);
        await connB.InvokeAsync("JoinPoll", poll.Id);
        await WaitForAsync(() => rosterA?.Count == 2);

        await connB.StopAsync();
        await connB.DisposeAsync();
        await WaitForAsync(() => rosterA?.Count == 1);

        Assert.Contains(rosterA!, p => p.UserId == userA.Id);
        Assert.DoesNotContain(rosterA!, p => p.UserId == userB.Id);
    }

    [Fact]
    public async Task JoinPoll_WhenNoAccess_IsRejected()
    {
        var owner = await _factory.SeedUser();
        var outsider = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id,
            visibilityType: VisibilityType.VisibleForSelectedOnly);
        var poll = await _factory.SeedPoll(project.Id);

        await using var conn = CreateHubConnection(outsider.Id);
        await conn.StartAsync();

        await Assert.ThrowsAsync<HubException>(() => conn.InvokeAsync("JoinPoll", poll.Id));
    }

    [Fact]
    public async Task StartAsync_WhenUnauthenticated_IsRejected()
    {
        await using var conn = CreateHubConnection(userId: null);

        await Assert.ThrowsAnyAsync<Exception>(() => conn.StartAsync());
    }

    [Fact]
    public async Task PollMutation_PingsPollChangedToGroupWithActorId()
    {
        var userA = await _factory.SeedUser();
        var userB = await _factory.SeedUser();
        var project = await _factory.SeedProject(userA.Id);
        await _factory.SeedPermission(project.Id, userB.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);

        PollChangedNotification? received = null;
        await using var conn = CreateHubConnection(userB.Id);
        conn.On<PollChangedNotification>(PollHub.PollChanged, n => received = n);

        await conn.StartAsync();
        await conn.InvokeAsync("JoinPoll", poll.Id);

        using var client = _factory.CreateAuthenticatedClient(userA.Id);
        var response = await client.PutAsJsonAsync($"/api/project/poll/{poll.Id}",
            new { name = "Renamed", description = "Updated" });
        response.EnsureSuccessStatusCode();

        await WaitForAsync(() => received is not null);
        Assert.Equal(poll.Id, received!.PollId);
        Assert.Equal(userA.Id, received.ActorUserId);
    }
}
