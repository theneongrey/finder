using System.Text.Json;
using Finder.Business.Shared.Services;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Project.Services;

/// <summary>
/// Fires debounced "poll updated" notifications whose <see cref="Entities.PendingPollUpdate.DueAt"/>
/// has passed. Claiming a row and queueing its notifications happen in one transaction, so a failure
/// leaves the row in place to be retried after <see cref="RetryDelay"/>.
/// Assumes a single API instance (see the wiki's scaling notes).
/// </summary>
public class PollUpdateDispatcher(
    IServiceScopeFactory scopeFactory,
    MailOutboxDispatcher mailOutboxDispatcher,
    ILogger<PollUpdateDispatcher> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(1);
    private static readonly TimeSpan RetryDelay = TimeSpan.FromMinutes(1);
    private readonly SemaphoreSlim _processLock = new(1, 1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval);
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await ProcessDueAsync(stoppingToken);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    logger.LogError(ex, "Processing pending poll updates failed");
                }
            }
        }
        catch (OperationCanceledException)
        {
        }
    }

    /// <summary>Fires every pending update that is due. Serialized, so it is safe to call from tests.</summary>
    public async Task ProcessDueAsync(CancellationToken cancellationToken = default)
    {
        await _processLock.WaitAsync(cancellationToken);
        try
        {
            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var now = DateTime.UtcNow;
            var due = await dbContext.PendingPollUpdates
                .AsNoTracking()
                .Where(p => p.DueAt <= now)
                .ToListAsync(cancellationToken);

            var fired = false;
            foreach (var pending in due)
            {
                if (await TryFireAsync(scope.ServiceProvider, dbContext, pending, cancellationToken))
                {
                    fired = true;
                }
            }

            // MailOutbox signals on enqueue, which is before our commit; wake the outbox again now
            // that the mails are visible, instead of leaving them for its safety-net poll.
            if (fired)
            {
                mailOutboxDispatcher.Signal();
            }
        }
        finally
        {
            _processLock.Release();
        }
    }

    /// <summary>
    /// Claims one due row and queues its notifications atomically. Returns whether anything was committed.
    /// </summary>
    private async Task<bool> TryFireAsync(IServiceProvider services, AppDbContext dbContext,
        Entities.PendingPollUpdate pending, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Claim the row only if no newer edit pushed its due time out in the meantime.
            var claimed = await dbContext.PendingPollUpdates
                .Where(p => p.PollId == pending.PollId && p.DueAt == pending.DueAt)
                .ExecuteDeleteAsync(cancellationToken);
            if (claimed == 0)
            {
                return false;
            }

            PollUpdateNotificationQueue.PollChanges? changes;
            try
            {
                changes = JsonSerializer.Deserialize<PollUpdateNotificationQueue.PollChanges>(pending.Changes);
            }
            catch (JsonException ex)
            {
                // Retrying can't fix a malformed row; drop it rather than retry it forever.
                logger.LogError(ex, "Dropping unreadable pending poll update for poll {PollId}", pending.PollId);
                changes = null;
            }

            if (changes is not null)
            {
                await FireAsync(services, dbContext, pending.PollId, changes);
            }

            await transaction.CommitAsync(cancellationToken);
            return true;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await transaction.RollbackAsync(CancellationToken.None);
            dbContext.ChangeTracker.Clear();
            logger.LogError(ex, "Sending poll-updated notifications for poll {PollId} failed; retrying in {RetryDelay}",
                pending.PollId, RetryDelay);

            // Back off so a persistent failure isn't retried every tick. A newer edit (different DueAt) wins.
            var retryAt = DateTime.UtcNow + RetryDelay;
            await dbContext.PendingPollUpdates
                .Where(p => p.PollId == pending.PollId && p.DueAt == pending.DueAt)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.DueAt, retryAt),
                    CancellationToken.None);
            return false;
        }
    }

    private static async Task FireAsync(IServiceProvider services, AppDbContext dbContext, string pollId,
        PollUpdateNotificationQueue.PollChanges changes)
    {
        var poll = await dbContext.Polls
            .Include(p => p.Project).ThenInclude(proj => proj.Creator)
            .Include(p => p.Project).ThenInclude(proj => proj.Permissions).ThenInclude(perm => perm.Person)
            .Where(p => p.Id == pollId)
            .FirstOrDefaultAsync();

        if (poll is null)
        {
            return;
        }

        var nameChanged = changes.FirstOldName is not null && changes.FirstOldName != changes.LastNewName;
        var summary = new PollUpdateSummary(
            NameChanged: nameChanged,
            OldName: changes.FirstOldName ?? "",
            NewName: changes.LastNewName ?? poll.Name,
            DescriptionChanged: changes.DescriptionChanged,
            OptionsAdded: [.. changes.NetOptionsAdded.Values],
            OptionsRemoved: [.. changes.NetOptionsRemoved.Values],
            OptionsModified: changes.OptionsModified
        );

        if (!summary.HasChanges)
        {
            return;
        }

        var recipients = poll.Project.Permissions
            .Select(p => p.Person)
            .Append(poll.Project.Creator)
            .Where(p => p.Id != changes.ActionUserId)
            .ToList();

        var notificationService = services.GetRequiredService<ProjectNotificationService>();
        await notificationService.SendPollUpdatedNotificationsAsync(recipients, changes.ActionUserName, poll.Project,
            poll, summary);
    }
}
