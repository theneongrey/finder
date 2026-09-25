using Finder.Business.Project.Services;
using Finder.Business.Shared;

namespace Finder.Business.Project.Api.Responses;

/// <summary>Poll-level fields, sent only when the poll itself changed since the client's token.</summary>
public class PollDeltaPoll
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required int OptionType { get; set; }
    public DateTime? CloseDate { get; set; }
    public required bool IsClosed { get; set; }
}

public class PollDeltaResponse
{
    /// <summary>Null when no poll-level field changed.</summary>
    public PollDeltaPoll? Poll { get; set; }

    /// <summary>Options added or changed since the token; apply upsert-by-id.</summary>
    public required PollResponseOption[] Options { get; set; }

    /// <summary>Comments added or changed since the token; apply upsert-by-id.</summary>
    public required CommentResponse[] Comments { get; set; }

    /// <summary>Ids of every option currently on the poll — used to reconcile hard-deletes.</summary>
    public required string[] CurrentOptionIds { get; set; }

    /// <summary>Ids of every comment currently on the poll — used to reconcile hard-deletes.</summary>
    public required string[] CurrentCommentIds { get; set; }

    /// <summary>Server UtcNow at query start; echo back as <c>since</c> on the next delta call.</summary>
    public required DateTime SyncToken { get; set; }
}

public static class PollDeltaMapper
{
    public static PollDeltaResponse ToPollDeltaResponse(this PollDelta delta, Guid? userId)
    {
        return new PollDeltaResponse
        {
            Poll = delta.ChangedPoll is null ? null : new PollDeltaPoll
            {
                Id = SlugHelper.ToSlug(delta.ChangedPoll.Name, delta.ChangedPoll.Id),
                Name = delta.ChangedPoll.Name,
                Description = delta.ChangedPoll.Description,
                OptionType = (int)delta.ChangedPoll.OptionType,
                CloseDate = delta.ChangedPoll.CloseDate.HasValue
                    ? DateTime.SpecifyKind(delta.ChangedPoll.CloseDate.Value, DateTimeKind.Utc)
                    : null,
                IsClosed = delta.ChangedPoll.CloseDate != null && delta.ChangedPoll.CloseDate <= DateTime.UtcNow
            },
            Options = delta.ChangedOptions
                .OrderBy(o => o.Created)
                .Select(o => o.ToPollResponseOption(userId))
                .ToArray(),
            Comments = delta.ChangedComments
                .OrderBy(c => c.Created)
                .Select(c => c.ToCommentResponse())
                .ToArray(),
            CurrentOptionIds = delta.CurrentOptions
                .Select(o => SlugHelper.ToSlug(SlugHelper.OptionSlugName(o.Text), o.Id))
                .ToArray(),
            CurrentCommentIds = delta.CurrentComments
                .Select(c => c.Id.ToString())
                .ToArray(),
            SyncToken = delta.SyncToken
        };
    }
}
