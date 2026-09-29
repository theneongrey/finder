namespace Finder.Business.Shared.Entities;

/// <summary>
/// A mail waiting to be delivered. Written by <c>MailOutbox</c> and drained by
/// <c>MailOutboxDispatcher</c>, so sending never blocks a request, survives restarts,
/// and is retried when the SMTP server is unavailable. Delivered rows are deleted.
/// </summary>
public class OutboxMail : BaseEntity
{
    public Guid Id { get; set; }

    /// <summary>The serialized <c>Mail</c>; the template is rendered at send time.</summary>
    public required string Payload { get; set; }

    public int Attempts { get; set; }
    public DateTime NextAttemptAt { get; set; }
    public string? LastError { get; set; }
}
