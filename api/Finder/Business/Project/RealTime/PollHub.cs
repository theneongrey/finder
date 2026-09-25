using System.Security.Claims;
using Finder.Business.Project.Entities;
using Finder.Business.Shared;
using Finder.Database;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Project.RealTime;

/// <summary>
/// Presence/signalling channel for the poll detail page. Clients join a poll's group to
/// receive the live roster of who else is present. No poll data is serialized here — data
/// continues to flow over REST. Sits behind cookie auth (same scheme as the REST endpoints).
/// </summary>
[Authorize]
public sealed class PollHub : Hub
{
    public const string PresenceChanged = "PresenceChanged";
    public const string PollChanged = "PollChanged";

    /// <summary>
    /// Group a poll's connections share. Used by the hub for presence broadcasts and by
    /// <see cref="PollChangeNotifier"/> for change pings — single source of truth so both agree.
    /// </summary>
    public static string GroupName(string pollId) => $"poll:{pollId}";

    private readonly AppDbContext _dbContext;
    private readonly PollPresenceRegistry _registry;

    public PollHub(AppDbContext dbContext, PollPresenceRegistry registry)
    {
        _dbContext = dbContext;
        _registry = registry;
    }

    public async Task JoinPoll(string pollId)
    {
        var userId = GetUserId();
        if (userId is null)
        {
            throw new HubException("Unauthorized");
        }

        var id = SlugHelper.ExtractId(pollId);

        // Same read predicate as ProjectService.GetPoll: public project OR creator OR any permission.
        var hasAccess = await _dbContext.Polls
            .AnyAsync(p => p.Id == id && (
                p.Project.VisibilityType == VisibilityType.VisibleForEverbody ||
                p.Project.Creator.Id == userId ||
                p.Project.Permissions.Any(permission => permission.PersonKey == userId)));

        if (!hasAccess)
        {
            throw new HubException("Forbidden");
        }

        var participant = await _dbContext.Persons
            .Where(person => person.Id == userId)
            .Select(person => new PollParticipant(person.Id, person.Name, person.Picture))
            .SingleOrDefaultAsync();

        if (participant is null)
        {
            // Authenticated (past [Authorize]) but no matching Person row — a data edge case,
            // not an auth failure.
            throw new HubException("User not found");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(id));
        _registry.Join(id, Context.ConnectionId, participant);
        await BroadcastRoster(id);
    }

    public async Task LeavePoll(string pollId)
    {
        var id = SlugHelper.ExtractId(pollId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(id));

        if (_registry.LeavePoll(id, Context.ConnectionId))
        {
            await BroadcastRoster(id);
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        foreach (var pollId in _registry.Disconnect(Context.ConnectionId))
        {
            await BroadcastRoster(pollId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    private async Task BroadcastRoster(string pollId)
    {
        var roster = _registry.GetRoster(pollId);
        await Clients.Group(GroupName(pollId)).SendAsync(PresenceChanged, roster);
    }

    private Guid? GetUserId()
    {
        // Hub invocations have no HttpContext, so read the identity straight off Context.User
        // (same NameIdentifier claim UserService.GetUserId reads from the cookie).
        var id = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(id, out var guid) ? guid : null;
    }
}
