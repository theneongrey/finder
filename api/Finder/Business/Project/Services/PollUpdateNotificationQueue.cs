using System.Collections.Concurrent;
using Finder.Business.Project.Setup;
using Finder.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Finder.Business.Project.Services;

public class PollUpdateNotificationQueue(IServiceScopeFactory scopeFactory, IOptions<NotificationOptions> options)
{
    private readonly ConcurrentDictionary<string, (CancellationTokenSource Cts, string ActionUserName, Guid ActionUserId)> _pending = new();
    private readonly int _debounceMs = options.Value.PollUpdateDebounceSeconds * 1000;

    public void Enqueue(string pollId, string actionUserName, Guid actionUserId)
    {
        if (_pending.TryRemove(pollId, out var existing))
        {
            existing.Cts.Cancel();
            existing.Cts.Dispose();
        }

        var cts = new CancellationTokenSource();
        _pending[pollId] = (cts, actionUserName, actionUserId);

        _ = Task.Run(async () =>
        {
            try
            {
                await Task.Delay(_debounceMs, cts.Token);
                _pending.TryRemove(pollId, out _);
                await FireAsync(pollId, actionUserName, actionUserId);
            }
            catch (OperationCanceledException)
            {
                // Debounced — a newer change was enqueued for this poll
            }
        }, cts.Token);
    }

    private async Task FireAsync(string pollId, string actionUserName, Guid actionUserId)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var mailService = scope.ServiceProvider.GetRequiredService<ProjectMailService>();

            var poll = await dbContext.Polls
                .Include(p => p.Project).ThenInclude(proj => proj.Creator)
                .Include(p => p.Project).ThenInclude(proj => proj.Permissions).ThenInclude(perm => perm.Person)
                .Where(p => p.Id == pollId)
                .FirstOrDefaultAsync();

            if (poll is null) return;

            var recipients = poll.Project.Permissions
                .Select(p => p.Person)
                .Append(poll.Project.Creator)
                .Where(p => p.Id != actionUserId)
                .ToList();

            await mailService.SendPollUpdatedNotificationsAsync(recipients, actionUserName, poll.Project, poll);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error in PollUpdateNotificationQueue: " + ex.Message);
        }
    }
}
