namespace Finder.Business.Feedback.Setup;

public class FeedbackOptions
{
    /// <summary>Address that receives the daily feedback digest.</summary>
    public required string RecipientEmail { get; set; }

    /// <summary>Local time of day (in <see cref="DigestTimeZone"/>) when the digest is sent.</summary>
    public TimeOnly DigestTime { get; set; } = new(17, 0);

    /// <summary>IANA time zone id for <see cref="DigestTime"/>.</summary>
    public string DigestTimeZone { get; set; } = "Europe/Berlin";

    /// <summary>How often the background worker checks whether a digest is due.</summary>
    public int DigestCheckIntervalMinutes { get; set; } = 5;
}
