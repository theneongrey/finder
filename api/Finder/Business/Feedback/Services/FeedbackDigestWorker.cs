using Finder.Business.Feedback.Setup;
using Microsoft.Extensions.Options;

namespace Finder.Business.Feedback.Services;

/// <summary>Periodically lets <see cref="FeedbackDigestService"/> check whether the daily digest is due.</summary>
public class FeedbackDigestWorker(
    IServiceScopeFactory scopeFactory,
    IOptions<FeedbackOptions> feedbackOptions,
    ILogger<FeedbackDigestWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromMinutes(Math.Max(1, feedbackOptions.Value.DigestCheckIntervalMinutes));
        using var timer = new PeriodicTimer(interval);

        do
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var digestService = scope.ServiceProvider.GetRequiredService<FeedbackDigestService>();
                await digestService.SendPendingDigest(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                // Keep the loop alive; the next tick retries.
                logger.LogError(ex, "Feedback digest check failed");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
