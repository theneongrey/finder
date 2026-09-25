namespace Finder.Business.Project.RealTime;

/// <summary>
/// In-memory, thread-safe registry of which connections are currently present on which poll.
/// Registered as a singleton. Presence is signalling-only — no poll data is stored here.
///
/// Each connection also carries a last-activity timestamp so the notification path can tell an
/// actively-watching recipient (suppress their e-mail) from a present-but-idle one (still notify).
/// </summary>
public sealed class PollPresenceRegistry
{
    /// <summary>A present connection: who it belongs to and when it last showed activity.</summary>
    private sealed class PresenceEntry(PollParticipant participant, DateTime lastActivityUtc)
    {
        public PollParticipant Participant { get; } = participant;
        public DateTime LastActivityUtc { get; set; } = lastActivityUtc;
    }

    private readonly object _lock = new();

    // pollId -> (connectionId -> entry)
    private readonly Dictionary<string, Dictionary<string, PresenceEntry>> _byPoll = new();

    // connectionId -> set of pollIds it has joined (reverse index for disconnect cleanup)
    private readonly Dictionary<string, HashSet<string>> _byConnection = new();

    /// <summary>Registers a connection as present on a poll. Arriving counts as fresh activity.</summary>
    public void Join(string pollId, string connectionId, PollParticipant participant)
    {
        lock (_lock)
        {
            if (!_byPoll.TryGetValue(pollId, out var connections))
            {
                connections = new Dictionary<string, PresenceEntry>();
                _byPoll[pollId] = connections;
            }

            connections[connectionId] = new PresenceEntry(participant, DateTime.UtcNow);

            if (!_byConnection.TryGetValue(connectionId, out var polls))
            {
                polls = new HashSet<string>();
                _byConnection[connectionId] = polls;
            }

            polls.Add(pollId);
        }
    }

    /// <summary>
    /// Refreshes a connection's last-activity timestamp (client heartbeat). No-op if the
    /// connection is not present on the poll.
    /// </summary>
    public void RecordActivity(string pollId, string connectionId)
    {
        lock (_lock)
        {
            if (_byPoll.TryGetValue(pollId, out var connections)
                && connections.TryGetValue(connectionId, out var entry))
            {
                entry.LastActivityUtc = DateTime.UtcNow;
            }
        }
    }

    /// <summary>Removes a connection from a single poll. Returns true if it was present.</summary>
    public bool LeavePoll(string pollId, string connectionId)
    {
        lock (_lock)
        {
            var removed = false;

            if (_byPoll.TryGetValue(pollId, out var connections) && connections.Remove(connectionId))
            {
                removed = true;
                if (connections.Count == 0)
                {
                    _byPoll.Remove(pollId);
                }
            }

            if (_byConnection.TryGetValue(connectionId, out var polls))
            {
                polls.Remove(pollId);
                if (polls.Count == 0)
                {
                    _byConnection.Remove(connectionId);
                }
            }

            return removed;
        }
    }

    /// <summary>Removes a connection from every poll it joined. Returns the affected poll ids.</summary>
    public IReadOnlyList<string> Disconnect(string connectionId)
    {
        lock (_lock)
        {
            if (!_byConnection.TryGetValue(connectionId, out var polls))
            {
                return [];
            }

            var affected = polls.ToList();
            _byConnection.Remove(connectionId);

            foreach (var pollId in affected)
            {
                if (_byPoll.TryGetValue(pollId, out var connections) && connections.Remove(connectionId)
                    && connections.Count == 0)
                {
                    _byPoll.Remove(pollId);
                }
            }

            return affected;
        }
    }

    /// <summary>
    /// The current roster for a poll, deduplicated by user so multiple tabs of the same
    /// person appear as a single avatar.
    /// </summary>
    public IReadOnlyList<PollParticipant> GetRoster(string pollId)
    {
        lock (_lock)
        {
            if (!_byPoll.TryGetValue(pollId, out var connections))
            {
                return [];
            }

            // Picking an arbitrary connection per user is safe: name/picture are identical
            // across a single user's tabs, so any of them yields the same roster entry.
            return connections.Values
                .GroupBy(e => e.Participant.UserId)
                .Select(g => g.First().Participant)
                .ToList();
        }
    }

    /// <summary>
    /// True if the user is actively present on the poll — present on at least one connection whose
    /// last activity is within <paramref name="idleThreshold"/>. A present-but-idle user (no
    /// interaction for longer than the threshold, e.g. a backgrounded tab) returns false, so their
    /// notifications resume.
    /// </summary>
    public bool IsUserActive(string pollId, Guid userId, TimeSpan idleThreshold)
    {
        var cutoff = DateTime.UtcNow - idleThreshold;
        lock (_lock)
        {
            if (!_byPoll.TryGetValue(pollId, out var connections))
            {
                return false;
            }

            return connections.Values.Any(e => e.Participant.UserId == userId && e.LastActivityUtc >= cutoff);
        }
    }
}
