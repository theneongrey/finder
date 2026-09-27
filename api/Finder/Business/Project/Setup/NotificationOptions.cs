namespace Finder.Business.Project.Setup;

public class NotificationOptions
{
    public int PollUpdateDebounceSeconds { get; set; } = 10;

    /// <summary>
    /// How long a present user may go without interaction before counting as idle. While active
    /// (interacted within this window) a recipient's poll e-mails are suppressed; once idle they
    /// resume. Kept above the client heartbeat throttle so a still-watching user stays active.
    /// </summary>
    public int ActivePresenceIdleSeconds { get; set; } = 60;
}
