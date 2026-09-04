using Finder.Business.Project.Setup;
using Finder.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Finder.Business.Project.Services;

public record PollUpdateSummary(
    bool NameChanged,
    string OldName,
    string NewName,
    bool DescriptionChanged,
    IReadOnlyList<string> OptionsAdded,
    IReadOnlyList<string> OptionsRemoved,
    bool OptionsModified)
{
    public bool HasChanges =>
        NameChanged || DescriptionChanged ||
        OptionsAdded.Count > 0 || OptionsRemoved.Count > 0 ||
        OptionsModified;
}

public class PollUpdateNotificationQueue(IServiceScopeFactory scopeFactory, IOptions<NotificationOptions> options)
{
    private readonly int _debounceMs = options.Value.PollUpdateDebounceSeconds * 1000;
    private readonly object _lock = new();
    private readonly Dictionary<string, PollDebounceEntry> _pending = new();

    public void EnqueuePollUpdate(string pollId, string actionUserName, Guid actionUserId,
        string oldName, string newName, string oldDescription, string newDescription)
    {
        EnqueueChange(pollId, actionUserName, actionUserId, changes =>
        {
            changes.FirstOldName ??= oldName;
            changes.LastNewName = newName;
            if (oldDescription != newDescription)
            {
                changes.DescriptionChanged = true;
            }
        });
    }

    public void EnqueueOptionAdded(string pollId, string optionId, string optionText,
        string actionUserName, Guid actionUserId)
    {
        EnqueueChange(pollId, actionUserName, actionUserId, changes =>
        {
            changes.NetOptionsRemoved.Remove(optionId);
            changes.NetOptionsAdded[optionId] = optionText;
        });
    }

    public void EnqueueOptionRemoved(string pollId, string optionId, string optionText,
        string actionUserName, Guid actionUserId)
    {
        EnqueueChange(pollId, actionUserName, actionUserId, changes =>
        {
            if (!changes.NetOptionsAdded.Remove(optionId))
            {
                changes.NetOptionsRemoved[optionId] = optionText;
            }
        });
    }

    public void EnqueueOptionModified(string pollId, string actionUserName, Guid actionUserId)
    {
        EnqueueChange(pollId, actionUserName, actionUserId, changes =>
        {
            changes.OptionsModified = true;
        });
    }

    private void EnqueueChange(string pollId, string actionUserName, Guid actionUserId, Action<PollChanges> applyChange)
    {
        lock (_lock)
        {
            if (!_pending.TryGetValue(pollId, out var entry))
            {
                entry = new PollDebounceEntry();
                _pending[pollId] = entry;
            }
            else
            {
                entry.Cts.Cancel();
                entry.Cts.Dispose();
                entry.Cts = new CancellationTokenSource();
            }

            entry.Changes.ActionUserName = actionUserName;
            entry.Changes.ActionUserId = actionUserId;
            applyChange(entry.Changes);

            var cts = entry.Cts;
            var changes = entry.Changes;

            _ = Task.Run(async () =>
            {
                try
                {
                    await Task.Delay(_debounceMs, cts.Token);
                    lock (_lock)
                    {
                        // Bail if a newer enqueue replaced our CTS — it will fire instead.
                        if (!_pending.TryGetValue(pollId, out var current) || !ReferenceEquals(current.Cts, cts))
                        {
                            return;
                        }

                        _pending.Remove(pollId);
                    }
                    await FireAsync(pollId, changes);
                }
                catch (OperationCanceledException) { }
            });
        }
    }

    private async Task FireAsync(string pollId, PollChanges changes)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var mailService = scope.ServiceProvider.GetRequiredService<ProjectNotificationService>();

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

            await mailService.SendPollUpdatedNotificationsAsync(recipients, changes.ActionUserName, poll.Project, poll, summary);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error in PollUpdateNotificationQueue: " + ex.Message);
        }
    }

    private class PollDebounceEntry
    {
        public CancellationTokenSource Cts { get; set; } = new();
        public PollChanges Changes { get; } = new();
    }

    private class PollChanges
    {
        public string ActionUserName { get; set; } = "";
        public Guid ActionUserId { get; set; }
        public string? FirstOldName { get; set; }
        public string? LastNewName { get; set; }
        public bool DescriptionChanged { get; set; }
        public bool OptionsModified { get; set; }
        public Dictionary<string, string> NetOptionsAdded { get; } = new();
        public Dictionary<string, string> NetOptionsRemoved { get; } = new();
    }
}
