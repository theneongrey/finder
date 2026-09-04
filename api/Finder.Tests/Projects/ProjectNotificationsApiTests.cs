using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Finder.Business.Auth.Entities;
using Finder.Business.Permission.Entities;
using Finder.Business.Project.Setup;
using Finder.Business.Shared.Services;
using Finder.Tests.Infrastructure;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Finder.Tests.Projects;

public class ProjectNotificationsApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public ProjectNotificationsApiTests(FinderApiFactory factory) => _factory = factory;

    // Creates a child factory that replaces MailService with a capturing stub
    // and configures the debounce to 1 second so debounce tests complete quickly.
    private WebApplicationFactory<Program> CreateFactory(out CapturingMailService mail)
    {
        var captured = new CapturingMailService();
        mail = captured;
        return _factory.WithWebHostBuilder(b => b.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(MailService));
            if (descriptor != null) services.Remove(descriptor);
            services.AddSingleton<MailService>(captured);

            services.Configure<NotificationOptions>(o => o.PollUpdateDebounceSeconds = 1);
        }));
    }

    private static HttpClient AuthenticatedClient(WebApplicationFactory<Program> factory, Guid userId)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, userId.ToString());
        return client;
    }

    // --- Poll closed ---

    [Fact]
    public async Task ClosePoll_NotifiesProjectMembersExceptActor()
    {
        var owner = await _factory.SeedUser();
        var voter = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        await _factory.SeedPermission(project.Id, voter.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);

        using var factory = CreateFactory(out var mail);
        using var client = AuthenticatedClient(factory, owner.Id);

        var response = await client.PostAsync($"/api/polls/{poll.Id}/close", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Single(mail.SentMails);
        Assert.Equal(voter.Email, mail.SentMails[0].RecipientEmail);
        Assert.Equal("poll-closed", mail.SentMails[0].Template.Name);
    }

    [Fact]
    public async Task ClosePoll_ActorDoesNotReceiveNotification()
    {
        var owner = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        var poll = await _factory.SeedPoll(project.Id);

        using var factory = CreateFactory(out var mail);
        using var client = AuthenticatedClient(factory, owner.Id);

        await client.PostAsync($"/api/polls/{poll.Id}/close", null);

        Assert.Empty(mail.SentMails);
    }

    [Fact]
    public async Task ClosePoll_TestUserMember_SkippedInNotifications()
    {
        var owner = await _factory.SeedUser();
        var testUser = await _factory.SeedUser(role: Role.TestUser);
        var project = await _factory.SeedProject(owner.Id);
        await _factory.SeedPermission(project.Id, testUser.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);

        using var factory = CreateFactory(out var mail);
        using var client = AuthenticatedClient(factory, owner.Id);

        await client.PostAsync($"/api/polls/{poll.Id}/close", null);

        Assert.Empty(mail.SentMails);
    }

    // --- Poll reopened ---

    [Fact]
    public async Task ReopenPoll_NotifiesProjectMembersExceptActor()
    {
        var owner = await _factory.SeedUser();
        var voter = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        await _factory.SeedPermission(project.Id, voter.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id, closeDate: DateTime.UtcNow.AddDays(-1));

        using var factory = CreateFactory(out var mail);
        using var client = AuthenticatedClient(factory, owner.Id);

        var response = await client.PostAsync($"/api/polls/{poll.Id}/reopen", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Single(mail.SentMails);
        Assert.Equal(voter.Email, mail.SentMails[0].RecipientEmail);
        Assert.Equal("poll-reopened", mail.SentMails[0].Template.Name);
    }

    // --- New comment ---

    [Fact]
    public async Task AddComment_NotifiesAllMembersExceptCommenter()
    {
        var owner = await _factory.SeedUser();
        var voter = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        await _factory.SeedPermission(project.Id, voter.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);

        using var factory = CreateFactory(out var mail);
        using var client = AuthenticatedClient(factory, voter.Id);

        var response = await client.PostAsJsonAsync("/api/project/poll/comment", new
        {
            pollId = poll.Id,
            content = "Looks great!"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Single(mail.SentMails);
        Assert.Equal(owner.Email, mail.SentMails[0].RecipientEmail);
        Assert.Equal("new-comment", mail.SentMails[0].Template.Name);
        Assert.Equal("Looks great!", mail.SentMails[0].Template.Variables["comment"]);
    }

    // --- Permission removed ---

    [Fact]
    public async Task RemovePermission_NotifiesRemovedUser()
    {
        var owner = await _factory.SeedUser();
        var voter = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        await _factory.SeedPermission(project.Id, voter.Id, PermissionType.Voter);

        using var factory = CreateFactory(out var mail);
        using var client = AuthenticatedClient(factory, owner.Id);

        var response = await client.DeleteAsync(
            $"/api/permission/{project.Id}/{Uri.EscapeDataString(voter.Email)}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Single(mail.SentMails);
        Assert.Equal(voter.Email, mail.SentMails[0].RecipientEmail);
        Assert.Equal("permission-removed", mail.SentMails[0].Template.Name);
    }

    // --- PollUpdated debounce ---

    [Fact]
    public async Task UpdatePoll_DoesNotSendImmediateNotification()
    {
        var owner = await _factory.SeedUser();
        var voter = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        await _factory.SeedPermission(project.Id, voter.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);

        using var factory = CreateFactory(out var mail);
        using var client = AuthenticatedClient(factory, owner.Id);

        await client.PutAsJsonAsync($"/api/project/poll/{poll.Id}", new
        {
            name = "New name",
            description = ""
        });

        // Notification is debounced — no immediate send
        Assert.DoesNotContain(mail.SentMails, m => m.Template.Name == "poll-updated");
    }

    // --- In-app notifications ---

    [Fact]
    public async Task ClosePoll_CreatesInAppNotificationForMember()
    {
        var owner = await _factory.SeedUser();
        var voter = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        await _factory.SeedPermission(project.Id, voter.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);

        using var factory = CreateFactory(out _);
        using var ownerClient = AuthenticatedClient(factory, owner.Id);
        using var voterClient = AuthenticatedClient(factory, voter.Id);

        await ownerClient.PostAsync($"/api/polls/{poll.Id}/close", null);

        var response = await voterClient.GetAsync("/api/user/notifications");
        var notifications = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsArray();
        Assert.Single(notifications);
        Assert.Equal("PollClosed", notifications[0]!["key"]!.GetValue<string>());
    }

    [Fact]
    public async Task ClosePoll_TestUserMember_StillReceivesInAppNotification()
    {
        // TestUser skips email but should still get an in-app notification
        var owner = await _factory.SeedUser();
        var testUser = await _factory.SeedUser(role: Role.TestUser);
        var project = await _factory.SeedProject(owner.Id);
        await _factory.SeedPermission(project.Id, testUser.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);

        using var factory = CreateFactory(out var mail);
        using var ownerClient = AuthenticatedClient(factory, owner.Id);
        using var testUserClient = AuthenticatedClient(factory, testUser.Id);

        await ownerClient.PostAsync($"/api/polls/{poll.Id}/close", null);

        Assert.Empty(mail.SentMails);

        var response = await testUserClient.GetAsync("/api/user/notifications");
        var notifications = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsArray();
        Assert.Single(notifications);
        Assert.Equal("PollClosed", notifications[0]!["key"]!.GetValue<string>());
    }

    [Fact]
    public async Task AddPermission_CreatesInAppNotificationForRecipient()
    {
        var creator = await _factory.SeedUser();
        var target = await _factory.SeedUser();
        var project = await _factory.SeedProject(creator.Id);

        using var factory = CreateFactory(out _);
        using var creatorClient = AuthenticatedClient(factory, creator.Id);
        using var targetClient = AuthenticatedClient(factory, target.Id);

        await creatorClient.PutAsJsonAsync($"/api/permission/{project.Id}",
            new { email = target.Email, permissionType = (int)PermissionType.Voter });

        var response = await targetClient.GetAsync("/api/user/notifications");
        var notifications = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsArray();
        Assert.Single(notifications);
        Assert.Equal("PollShared", notifications[0]!["key"]!.GetValue<string>());
    }

    [Fact]
    public async Task RemovePermission_CreatesInAppNotificationForRemovedUser()
    {
        var owner = await _factory.SeedUser();
        var voter = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        await _factory.SeedPermission(project.Id, voter.Id, PermissionType.Voter);

        using var factory = CreateFactory(out _);
        using var ownerClient = AuthenticatedClient(factory, owner.Id);
        using var voterClient = AuthenticatedClient(factory, voter.Id);

        await ownerClient.DeleteAsync($"/api/permission/{project.Id}/{Uri.EscapeDataString(voter.Email)}");

        var response = await voterClient.GetAsync("/api/user/notifications");
        var notifications = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsArray();
        Assert.Single(notifications);
        Assert.Equal("AccessChanged", notifications[0]!["key"]!.GetValue<string>());
    }

    [Fact]
    public async Task AddComment_CreatesInAppNotificationForOwner()
    {
        var owner = await _factory.SeedUser();
        var voter = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        await _factory.SeedPermission(project.Id, voter.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);

        using var factory = CreateFactory(out _);
        using var voterClient = AuthenticatedClient(factory, voter.Id);
        using var ownerClient = AuthenticatedClient(factory, owner.Id);

        await voterClient.PostAsJsonAsync("/api/project/poll/comment",
            new { pollId = poll.Id, content = "Great poll!" });

        var response = await ownerClient.GetAsync("/api/user/notifications");
        var notifications = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsArray();
        Assert.Single(notifications);
        Assert.Equal("NewComment", notifications[0]!["key"]!.GetValue<string>());
    }

    [Fact]
    public async Task UpdatePoll_AfterDebounce_CollapsesTwoEditsIntoOneNotification()
    {
        var owner = await _factory.SeedUser();
        var voter = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        await _factory.SeedPermission(project.Id, voter.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);

        using var factory = CreateFactory(out var mail);
        using var client = AuthenticatedClient(factory, owner.Id);

        // Two rapid edits — second cancels the first debounce timer
        await client.PutAsJsonAsync($"/api/project/poll/{poll.Id}", new { name = "Edit 1", description = "" });
        await client.PutAsJsonAsync($"/api/project/poll/{poll.Id}", new { name = "Edit 2", description = "" });

        // Wait for debounce window (1s) plus a small margin
        await Task.Delay(1500);

        var pollUpdatedMails = mail.SentMails.Where(m => m.Template.Name == "poll-updated").ToList();
        Assert.Single(pollUpdatedMails);
        Assert.Equal(voter.Email, pollUpdatedMails[0].RecipientEmail);
    }
}
