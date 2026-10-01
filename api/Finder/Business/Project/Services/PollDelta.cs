using Finder.Business.Project.Entities;

namespace Finder.Business.Project.Services;

/// <summary>
/// The changes to a poll since a client's last sync token. Options and comments are the full
/// entities that changed (mapped to their usual response shapes by the caller); the current id
/// sets (option slugs, comment ids) let the client reconcile hard-deletes without tombstone tables.
///
/// ChangedOptions/ChangedComments are widened by the overlap window so no row committed near the
/// token boundary is missed (the client upserts by id, so overlap is harmless for data). The
/// Highlighted* id sets are the stricter "changed strictly after the token" subset — the client
/// flashes only those, so an item re-sent purely because of the overlap doesn't re-highlight.
/// </summary>
public sealed record PollDelta(
    Poll? ChangedPoll,
    IReadOnlyList<Option> ChangedOptions,
    IReadOnlyList<Comment> ChangedComments,
    IReadOnlyList<string> CurrentOptionIds,
    IReadOnlyList<string> CurrentCommentIds,
    IReadOnlyList<string> HighlightedOptionIds,
    IReadOnlyList<string> HighlightedCommentIds,
    DateTime SyncToken);
