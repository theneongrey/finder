using Microsoft.AspNetCore.SignalR;

namespace Finder.Business.Project.RealTime;

/// <summary>
/// Describes *what* changed so present clients can show a specific message ("added an option",
/// "renamed the poll", …) instead of a generic "updated". <see cref="Kind"/> is one of the
/// <see cref="PollChangeKind"/> constants; <see cref="Target"/> is the affected option/poll title
/// where the message interpolates it (null otherwise).
/// </summary>
public sealed record PollChangeInfo(string Kind, string? Target = null);

/// <summary>Change kinds shared with the client (keys under <c>project.results.updateToast</c>).</summary>
public static class PollChangeKind
{
    public const string OptionAdded = "optionAdded";
    public const string OptionRemoved = "optionRemoved";
    public const string OptionRenamed = "optionRenamed";
    public const string OptionDescribed = "optionDescribed";
    public const string OptionUpdated = "optionUpdated";
    public const string PollRenamed = "pollRenamed";
    public const string PollDescriptionUpdated = "pollDescriptionUpdated";
    public const string CommentAdded = "commentAdded";
    public const string CommentAddedOption = "commentAddedOption";
    public const string VoteCast = "voteCast";
    public const string PollClosed = "pollClosed";
    public const string PollReopened = "pollReopened";
}

/// <summary>Thin ping carried to clients on <see cref="PollHub.PollChanged"/>.</summary>
public sealed record PollChangedNotification(string PollId, Guid? ActorUserId, PollChangeInfo? Change = null);

public sealed class PollChangeNotifier : IPollChangeNotifier
{
    private readonly IHubContext<PollHub> _hubContext;
    private readonly ILogger<PollChangeNotifier> _logger;

    public PollChangeNotifier(IHubContext<PollHub> hubContext, ILogger<PollChangeNotifier> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task PollChanged(string pollId, Guid? actorUserId, PollChangeInfo? change = null)
    {
        // Best-effort: the mutation has already committed and REST is the source of truth. A failed
        // ping must never surface as a 500 (which would make the caller retry a successful write) —
        // present clients still recover via the manual refresh / next delta call.
        try
        {
            await _hubContext.Clients
                .Group(PollHub.GroupName(pollId))
                .SendAsync(PollHub.PollChanged, new PollChangedNotification(pollId, actorUserId, change));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to broadcast PollChanged for poll {PollId}", pollId);
        }
    }
}
