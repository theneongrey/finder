using System.Text.Json;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Shared.Services;

/// <summary>
/// Delivers queued <see cref="Entities.OutboxMail"/> rows. Woken immediately by <see cref="Signal"/>
/// and otherwise polls, so mails queued before a restart or deferred after a failure still go out.
/// Failed sends are retried with exponential backoff; after <see cref="MaxAttempts"/> the row is
/// parked (kept for inspection) and an error is logged.
/// Assumes a single API instance (see the wiki's scaling notes).
/// </summary>
public class MailOutboxDispatcher(
    IServiceScopeFactory scopeFactory,
    MailService mailService,
    ILogger<MailOutboxDispatcher> logger) : BackgroundService
{
    public const int MaxAttempts = 8;
    private const int BatchSize = 20;
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan MaxBackoff = TimeSpan.FromHours(1);

    private readonly SemaphoreSlim _wakeUp = new(0);
    private readonly SemaphoreSlim _drainLock = new(1, 1);

    public void Signal()
    {
        // Coalesce: one pending wake-up is enough to drain everything.
        if (_wakeUp.CurrentCount == 0)
        {
            _wakeUp.Release();
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DrainAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Mail outbox drain failed");
            }

            try
            {
                await _wakeUp.WaitAsync(PollInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }

    /// <summary>Sends every mail that is due. Serialized, so it is safe to call from tests.</summary>
    public async Task DrainAsync(CancellationToken cancellationToken = default)
    {
        await _drainLock.WaitAsync(cancellationToken);
        try
        {
            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            while (!cancellationToken.IsCancellationRequested)
            {
                var now = DateTime.UtcNow;
                var batch = await dbContext.OutboxMails
                    .Where(m => m.NextAttemptAt <= now && m.Attempts < MaxAttempts)
                    .OrderBy(m => m.NextAttemptAt)
                    .Take(BatchSize)
                    .ToListAsync(cancellationToken);

                if (batch.Count == 0)
                {
                    return;
                }

                foreach (var outboxMail in batch)
                {
                    try
                    {
                        var mail = JsonSerializer.Deserialize<Mail>(outboxMail.Payload)
                                   ?? throw new InvalidOperationException("Empty mail payload");
                        await mailService.SendAsync(mail);
                        dbContext.OutboxMails.Remove(outboxMail);
                    }
                    catch (Exception ex)
                    {
                        outboxMail.Attempts++;
                        outboxMail.LastError = ex.Message.Length > 1000 ? ex.Message[..1000] : ex.Message;
                        outboxMail.NextAttemptAt = DateTime.UtcNow + Backoff(outboxMail.Attempts);

                        if (outboxMail.Attempts >= MaxAttempts)
                        {
                            logger.LogError(ex, "Giving up on outbox mail {MailId} after {Attempts} attempts",
                                outboxMail.Id, outboxMail.Attempts);
                        }
                        else
                        {
                            logger.LogWarning(ex, "Sending outbox mail {MailId} failed (attempt {Attempts}), retrying",
                                outboxMail.Id, outboxMail.Attempts);
                        }
                    }
                }

                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }
        finally
        {
            _drainLock.Release();
        }
    }

    private static TimeSpan Backoff(int attempts)
    {
        var backoff = TimeSpan.FromMinutes(Math.Pow(2, attempts - 1));
        return backoff < MaxBackoff ? backoff : MaxBackoff;
    }
}
