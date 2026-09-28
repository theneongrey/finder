namespace Finder.Business.Preview.Setup;

public class PreviewOptions
{
    public const string SectionName = "Preview";

    /// <summary>Upper bound for a page's redirect chain to settle in the headless browser.</summary>
    public int PlaywrightTimeoutSeconds { get; set; } = 10;

    /// <summary>
    /// How long to wait for the network to go idle after navigation settled, so client-rendered pages can
    /// render. Commercial pages rarely reach idle (analytics, polling), so this is capped short.
    /// </summary>
    public int PlaywrightNetworkIdleMilliseconds { get; set; } = 2500;

    /// <summary>How long a fetched preview is reused for the same URL and language.</summary>
    public int CacheMinutes { get; set; } = 360;

    /// <summary>
    /// How long an incomplete preview (no title, description or image) is reused. Kept short: it may be a
    /// bot-challenge page, and the real page may be reachable soon.
    /// </summary>
    public int PartialCacheMinutes { get; set; } = 10;

    /// <summary>Upper bound for the number of cached previews.</summary>
    public int CacheMaxEntries { get; set; } = 1000;
}
