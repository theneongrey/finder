using Microsoft.AspNetCore.SignalR;

namespace Finder.Business.Project.RealTime;

/// <summary>Thin ping carried to clients on <see cref="PollHub.PollChanged"/>.</summary>
public sealed record PollChangedNotification(string PollId, Guid? ActorUserId);

public sealed class PollChangeNotifier : IPollChangeNotifier
{
    private readonly IHubContext<PollHub> _hubContext;

    public PollChangeNotifier(IHubContext<PollHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task PollChanged(string pollId, Guid? actorUserId)
    {
        return _hubContext.Clients
            .Group(PollHub.GroupName(pollId))
            .SendAsync(PollHub.PollChanged, new PollChangedNotification(pollId, actorUserId));
    }
}
