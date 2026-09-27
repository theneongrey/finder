using Finder.Business.Project.Entities;

namespace Finder.Business.Project.Services;

/// <summary>
/// The changes to a poll since a client's last sync token. Options and comments are the full
/// entities that changed (mapped to their usual response shapes by the caller); the current id
/// sets let the client reconcile hard-deletes without tombstone tables.
/// </summary>
public sealed record PollDelta(
    Poll? ChangedPoll,
    IReadOnlyList<Option> ChangedOptions,
    IReadOnlyList<Comment> ChangedComments,
    IReadOnlyList<Option> CurrentOptions,
    IReadOnlyList<Comment> CurrentComments,
    DateTime SyncToken);
