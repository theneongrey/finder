using Finder.Business.Feedback.Entities;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Database;

namespace Finder.Business.Feedback.Services;

public class FeedbackService(
    AppDbContext dbContext,
    UserService userService,
    FeedbackLimitService limitService,
    TimeProvider timeProvider)
{
    public const int MaxCommentLength = 2000;
    public const int MaxPageLength = 500;

    // Check-then-insert must not interleave, or a script firing requests in parallel would pass the
    // limits before any of its rows exist. Feedback is rare, so one app-wide gate is enough.
    private static readonly SemaphoreSlim SubmitGate = new(1, 1);

    /// <summary>Stores the feedback for the next daily digest (see <see cref="FeedbackDigestService"/>).</summary>
    public async Task<Result> SubmitFeedback(FeedbackType type, string? comment, string? page)
    {
        // No StripHtml: feedback often quotes markup (e.g. "<ds-switch> is broken"), and every
        // value is HTML-encoded when the digest is rendered, so the raw text is safe to keep.
        var cleanComment = comment?.Trim() ?? string.Empty;
        var cleanPage = page?.Trim() ?? string.Empty;

        if (!Enum.IsDefined(type)
            || cleanComment.Length == 0 || cleanComment.Length > MaxCommentLength
            || cleanPage.Length == 0 || cleanPage.Length > MaxPageLength)
        {
            return Result.Fail(400);
        }

        var userId = userService.GetUserId();
        if (!userId.HasValue)
        {
            return Result.Fail(401);
        }

        await SubmitGate.WaitAsync();
        try
        {
            var limit = await limitService.Check(userId.Value);
            switch (limit)
            {
                case FeedbackLimitResult.Disabled:
                case FeedbackLimitResult.ScriptDetected:
                    return Result.Fail(403);
                case FeedbackLimitResult.RateLimited:
                    return Result.Fail(429);
            }

            dbContext.FeedbackSubmissions.Add(new FeedbackSubmission
            {
                Id = Guid.NewGuid(),
                PersonId = userId.Value,
                Type = type,
                Comment = cleanComment,
                Page = cleanPage,
                SubmittedAt = timeProvider.GetUtcNow().UtcDateTime
            });
            await dbContext.SaveChangesAsync();
        }
        finally
        {
            SubmitGate.Release();
        }

        return Result.Success(204);
    }
}
