using System.Text.Json;
using Finder.Business.Project.Entities;
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

/// <summary>
/// Debounces "poll updated" e-mails: edits to a poll accumulate in its <see cref="PendingPollUpdate"/>
/// row, and every edit pushes the due time out by the debounce window. <see cref="PollUpdateDispatcher"/>
/// fires rows once they are due. State lives in the database, so pending notifications survive restarts.
/// </summary>
public class PollUpdateNotificationQueue(AppDbContext dbContext, IOptions<NotificationOptions> options)
{
    private readonly TimeSpan _debounce = TimeSpan.FromSeconds(options.Value.PollUpdateDebounceSeconds);

    public Task EnqueuePollUpdate(string pollId, string actionUserName, Guid actionUserId,
        string oldName, string newName, string oldDescription, string newDescription) =>
        EnqueueChange(pollId, actionUserName, actionUserId, changes =>
        {
            changes.FirstOldName ??= oldName;
            changes.LastNewName = newName;
            if (oldDescription != newDescription)
            {
                changes.DescriptionChanged = true;
            }
        });

    public Task EnqueueOptionAdded(string pollId, string optionId, string optionText,
        string actionUserName, Guid actionUserId) =>
        EnqueueChange(pollId, actionUserName, actionUserId, changes =>
        {
            changes.NetOptionsRemoved.Remove(optionId);
            changes.NetOptionsAdded[optionId] = optionText;
        });

    public Task EnqueueOptionRemoved(string pollId, string optionId, string optionText,
        string actionUserName, Guid actionUserId) =>
        EnqueueChange(pollId, actionUserName, actionUserId, changes =>
        {
            if (!changes.NetOptionsAdded.Remove(optionId))
            {
                changes.NetOptionsRemoved[optionId] = optionText;
            }
        });

    public Task EnqueueOptionModified(string pollId, string actionUserName, Guid actionUserId) =>
        EnqueueChange(pollId, actionUserName, actionUserId, changes => changes.OptionsModified = true);

    private async Task EnqueueChange(string pollId, string actionUserName, Guid actionUserId,
        Action<PollChanges> applyChange)
    {
        // Two edits to the same poll can race to insert its row; the loser re-reads and merges.
        for (var attempt = 0; ; attempt++)
        {
            var pending = await dbContext.PendingPollUpdates.SingleOrDefaultAsync(p => p.PollId == pollId);
            var changes = pending is null
                ? new PollChanges()
                : JsonSerializer.Deserialize<PollChanges>(pending.Changes) ?? new PollChanges();

            changes.ActionUserName = actionUserName;
            changes.ActionUserId = actionUserId;
            applyChange(changes);

            if (pending is null)
            {
                pending = new PendingPollUpdate { PollId = pollId, Changes = "" };
                dbContext.PendingPollUpdates.Add(pending);
            }

            pending.Changes = JsonSerializer.Serialize(changes);
            pending.DueAt = DateTime.UtcNow + _debounce;

            try
            {
                await dbContext.SaveChangesAsync();
                return;
            }
            catch (DbUpdateException) when (attempt == 0)
            {
                dbContext.Entry(pending).State = EntityState.Detached;
            }
        }
    }

    public class PollChanges
    {
        public string ActionUserName { get; set; } = "";
        public Guid ActionUserId { get; set; }
        public string? FirstOldName { get; set; }
        public string? LastNewName { get; set; }
        public bool DescriptionChanged { get; set; }
        public bool OptionsModified { get; set; }
        public Dictionary<string, string> NetOptionsAdded { get; set; } = new();
        public Dictionary<string, string> NetOptionsRemoved { get; set; } = new();
    }
}
