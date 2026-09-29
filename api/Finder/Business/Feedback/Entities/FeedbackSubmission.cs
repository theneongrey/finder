using Finder.Business.Auth.Entities;
using Finder.Business.Shared.Entities;

namespace Finder.Business.Feedback.Entities;

/// <summary>
/// A submitted feedback, kept until it has gone out in the daily digest (plus a short retention
/// window, because the per-user limits count recent submissions).
/// </summary>
public class FeedbackSubmission : BaseEntity
{
    public Guid Id { get; set; }
    public Guid PersonId { get; set; }
    public FeedbackType Type { get; set; }
    public required string Comment { get; set; }
    public required string Page { get; set; }

    /// <summary>Submit time from the injected TimeProvider; the limits and the digest cutoff use it.</summary>
    public DateTime SubmittedAt { get; set; }

    /// <summary>When the digest containing this submission was sent; null while pending.</summary>
    public DateTime? SentAt { get; set; }

    public Person Person { get; set; } = null!;
}
