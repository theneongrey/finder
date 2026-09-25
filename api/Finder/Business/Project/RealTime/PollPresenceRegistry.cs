namespace Finder.Business.Project.RealTime;

/// <summary>
/// In-memory, thread-safe registry of which connections are currently present on which poll.
/// Registered as a singleton. Presence is signalling-only — no poll data is stored here.
/// </summary>
public sealed class PollPresenceRegistry
{
    private readonly object _lock = new();

    // pollId -> (connectionId -> participant)
    private readonly Dictionary<string, Dictionary<string, PollParticipant>> _byPoll = new();

    // connectionId -> set of pollIds it has joined (reverse index for disconnect cleanup)
    private readonly Dictionary<string, HashSet<string>> _byConnection = new();

    /// <summary>Registers a connection as present on a poll.</summary>
    public void Join(string pollId, string connectionId, PollParticipant participant)
    {
        lock (_lock)
        {
            if (!_byPoll.TryGetValue(pollId, out var connections))
            {
                connections = new Dictionary<string, PollParticipant>();
                _byPoll[pollId] = connections;
            }

            connections[connectionId] = participant;

            if (!_byConnection.TryGetValue(connectionId, out var polls))
            {
                polls = new HashSet<string>();
                _byConnection[connectionId] = polls;
            }

            polls.Add(pollId);
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

            return connections.Values
                .GroupBy(p => p.UserId)
                .Select(g => g.First())
                .ToList();
        }
    }
}
