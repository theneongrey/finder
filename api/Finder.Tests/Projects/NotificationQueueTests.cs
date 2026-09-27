using System.Net;
using System.Net.Http.Json;
using Finder.Business.Permission.Entities;
using Finder.Business.Project.Services;
using Finder.Business.Project.Setup;
using Finder.Business.Shared.Entities;
using Finder.Business.Shared.Services;
using Finder.Database;
using Finder.Tests.Infrastructure;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Finder.Tests.Projects;

/// <summary>
/// Mail and poll-update notifications are persisted (outbox / pending-update rows) and delivered
/// asynchronously, so they survive restarts and SMTP outages.
/// </summary>
public class NotificationQueueTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public NotificationQueueTests(FinderApiFactory factory) => _factory = factory;

    [Fact]
    public async Task ClosePoll_QueuesMailInsteadOfSendingInline()
    {
        var (factory, mail, owner, pollId) = await SetupPollWithVoter();
        using var client = AuthenticatedClient(factory, owner);

        var response = await client.PostAsync($"/api/polls/{pollId}/close", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Empty(mail.SentMails);
        Assert.Equal(1, await CountOutbox());

        await factory.Services.GetRequiredService<MailOutboxDispatcher>().DrainAsync();

        Assert.Single(mail.SentMails);
        Assert.Equal(0, await CountOutbox());
    }

    [Fact]
    public async Task FailedSend_StaysQueuedAndIsRetried()
    {
        var (factory, mail, owner, pollId) = await SetupPollWithVoter(failFirstSends: 1);
        using var client = AuthenticatedClient(factory, owner);
        await client.PostAsync($"/api/polls/{pollId}/close", null);
        var dispatcher = factory.Services.GetRequiredService<MailOutboxDispatcher>();

        await dispatcher.DrainAsync();

        Assert.Empty(mail.SentMails);
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var queued = await db.OutboxMails.SingleAsync();
            Assert.Equal(1, queued.Attempts);
            Assert.True(queued.NextAttemptAt > DateTime.UtcNow, "Retry should be backed off");
            Assert.NotNull(queued.LastError);

            // Fast-forward past the backoff.
            await db.OutboxMails.ExecuteUpdateAsync(s => s.SetProperty(m => m.NextAttemptAt, DateTime.UtcNow));
        }

        await dispatcher.DrainAsync();

        Assert.Single(mail.SentMails);
        Assert.Equal(0, await CountOutbox());
    }

    [Fact]
    public async Task PollUpdate_IsPersistedUntilDue_ThenSent()
    {
        var (factory, mail, owner, pollId) = await SetupPollWithVoter();
        using var client = AuthenticatedClient(factory, owner);

        await client.PutAsJsonAsync($"/api/project/poll/{pollId}", new { name = "Renamed poll", description = "" });

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var pending = await db.PendingPollUpdates.SingleAsync(p => p.PollId == pollId);
            Assert.Contains("Renamed poll", pending.Changes);
        }

        // A fresh dispatcher (as after a restart) picks the persisted row up once it is due.
        await Task.Delay(1200);
        await factory.Services.GetRequiredService<PollUpdateDispatcher>().ProcessDueAsync();
        await factory.Services.GetRequiredService<MailOutboxDispatcher>().DrainAsync();

        Assert.Contains(mail.SentMails, m => m.Template.Name == "poll-updated");
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.False(await db.PendingPollUpdates.AnyAsync(p => p.PollId == pollId));
        }
    }

    [Fact]
    public async Task PollUpdate_WhenQueueingFails_IsKeptAndRetried()
    {
        var (factory, mail, owner, pollId) = await SetupPollWithVoter(interceptor: new FailFirstOutboxInsert());
        using var client = AuthenticatedClient(factory, owner);
        await client.PutAsJsonAsync($"/api/project/poll/{pollId}", new { name = "Renamed poll", description = "" });
        var dispatcher = factory.Services.GetRequiredService<PollUpdateDispatcher>();
        int inAppBefore;
        using (var scope = _factory.Services.CreateScope())
        {
            inAppBefore = await scope.ServiceProvider.GetRequiredService<AppDbContext>().UserNotifications
                .CountAsync(n => n.PollId == pollId);
        }

        await Task.Delay(1200);
        await dispatcher.ProcessDueAsync();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var pending = await db.PendingPollUpdates.SingleAsync(p => p.PollId == pollId);
            Assert.True(pending.DueAt > DateTime.UtcNow, "Retry should be backed off");
            Assert.Equal(0, await db.OutboxMails.CountAsync());
            Assert.Equal(inAppBefore, await db.UserNotifications.CountAsync(n => n.PollId == pollId));

            // Fast-forward past the backoff.
            await db.PendingPollUpdates.ExecuteUpdateAsync(s => s.SetProperty(p => p.DueAt, DateTime.UtcNow));
        }

        await dispatcher.ProcessDueAsync();
        await factory.Services.GetRequiredService<MailOutboxDispatcher>().DrainAsync();

        Assert.Contains(mail.SentMails, m => m.Template.Name == "poll-updated");
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.False(await db.PendingPollUpdates.AnyAsync(p => p.PollId == pollId));
        }
    }

    private async Task<(WebApplicationFactory<Program> Factory, FailingThenCapturingMailService Mail, Guid Owner, string PollId)>
        SetupPollWithVoter(int failFirstSends = 0, IInterceptor? interceptor = null)
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.OutboxMails.ExecuteDeleteAsync();
            await db.PendingPollUpdates.ExecuteDeleteAsync();
        }

        var owner = await _factory.SeedUser();
        var voter = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        await _factory.SeedPermission(project.Id, voter.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);

        var mail = new FailingThenCapturingMailService(failFirstSends);
        var factory = _factory.WithWebHostBuilder(b => b.ConfigureServices(services =>
        {
            services.Remove(services.Single(d => d.ServiceType == typeof(MailService)));
            services.AddSingleton<MailService>(mail);
            services.Configure<NotificationOptions>(o => o.PollUpdateDebounceSeconds = 1);
            if (interceptor is not null)
            {
                services.ConfigureDbContext<AppDbContext>(o => o.AddInterceptors(interceptor));
            }
        }));

        return (factory, mail, owner.Id, poll.Id);
    }

    private async Task<int> CountOutbox()
    {
        using var scope = _factory.Services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<AppDbContext>().OutboxMails.CountAsync();
    }

    private static HttpClient AuthenticatedClient(WebApplicationFactory<Program> factory, Guid userId)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, userId.ToString());
        return client;
    }

    private sealed class FailingThenCapturingMailService(int failures) : CapturingMailService
    {
        private int _remainingFailures = failures;

        public override Task SendAsync(Mail mail)
        {
            if (_remainingFailures > 0)
            {
                _remainingFailures--;
                throw new InvalidOperationException("SMTP unavailable");
            }

            return base.SendAsync(mail);
        }
    }

    /// <summary>Fails the first save that inserts outbox mails, as a DB outage mid-fire would.</summary>
    private sealed class FailFirstOutboxInsert : SaveChangesInterceptor
    {
        private int _failed;

        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData,
            InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            var insertsOutboxMail = eventData.Context!.ChangeTracker.Entries<OutboxMail>()
                .Any(e => e.State == EntityState.Added);
            if (insertsOutboxMail && Interlocked.Exchange(ref _failed, 1) == 0)
            {
                throw new InvalidOperationException("Database unavailable");
            }

            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }
    }
}
