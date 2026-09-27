using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

/// <summary>
/// Debounce state for the "poll updated" e-mail: one row per poll, accumulating edits until no
/// further edit has arrived for the debounce window (<see cref="DueAt"/>). Persisted so a deploy
/// or restart doesn't drop pending notifications.
/// </summary>
public class PendingPollUpdate : BaseEntity
{
    public required string PollId { get; set; }

    /// <summary>The serialized accumulated changes (see <c>PollUpdateNotificationQueue.PollChanges</c>).</summary>
    public required string Changes { get; set; }

    public DateTime DueAt { get; set; }
}
