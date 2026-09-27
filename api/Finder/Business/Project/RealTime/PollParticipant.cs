namespace Finder.Business.Project.RealTime;

/// <summary>
/// A single entry in a poll's presence roster. Serialized to clients as
/// <c>{ userId, name, picture }</c> — no poll data is ever sent over the socket.
/// </summary>
public sealed record PollParticipant(Guid UserId, string? Name, string? Picture);
