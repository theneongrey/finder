using Microsoft.AspNetCore.SignalR;

namespace Finder.Business.Project.RealTime;

/// <summary>Thin ping carried to clients on <see cref="PollHub.PollChanged"/>.</summary>
public sealed record PollChangedNotification(string PollId, Guid? ActorUserId);

public sealed class PollChangeNotifier : IPollChangeNotifier
{
    private readonly IHubContext<PollHub> _hubContext;
    private readonly ILogger<PollChangeNotifier> _logger;

    public PollChangeNotifier(IHubContext<PollHub> hubContext, ILogger<PollChangeNotifier> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task PollChanged(string pollId, Guid? actorUserId)
    {
        // Best-effort: the mutation has already committed and REST is the source of truth. A failed
        // ping must never surface as a 500 (which would make the caller retry a successful write) —
        // present clients still recover via the manual refresh / next delta call.
        try
        {
            await _hubContext.Clients
                .Group(PollHub.GroupName(pollId))
                .SendAsync(PollHub.PollChanged, new PollChangedNotification(pollId, actorUserId));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to broadcast PollChanged for poll {PollId}", pollId);
        }
    }
}
