using Finder.Business.Preview.Setup;
using Microsoft.Extensions.Options;
using Microsoft.Playwright;

namespace Finder.Business.Preview.Services.PreviewHelper;

/// <summary>
/// Keeps one headless Chromium alive across requests. Starting the Playwright driver and a browser costs seconds,
/// while a fresh <see cref="IBrowserContext"/> per preview costs milliseconds and still isolates cookies and storage
/// between requests. The browser is relaunched when it crashes or disconnects, and recycled after
/// <see cref="PreviewOptions.BrowserMaxContexts"/> previews or <see cref="PreviewOptions.BrowserMaxAgeMinutes"/>,
/// since a long-running Chromium rendering untrusted pages grows in memory and keeps renderer state around.
/// </summary>
public sealed class PlaywrightBrowserProvider : IAsyncDisposable
{
    private readonly SemaphoreSlim _lock = new(1, 1);
    private readonly PreviewOptions _options;
    private readonly List<BrowserInstance> _retired = [];
    private IPlaywright? _playwright;
    private BrowserInstance? _current;

    public PlaywrightBrowserProvider(IOptions<PreviewOptions> options)
    {
        _options = options.Value;
    }

    /// <summary>
    /// Hands out the current browser for one preview. Dispose the lease when done: a recycled browser is only
    /// closed once every lease on it has been released, so in-flight previews are never cut off.
    /// </summary>
    public async Task<BrowserLease> AcquireAsync()
    {
        await _lock.WaitAsync();
        try
        {
            if (_current is null || !_current.Browser.IsConnected || IsDue(_current))
            {
                await RetireCurrentAsync();
                _current = await LaunchAsync();
            }

            _current.ContextsIssued++;
            _current.ActiveLeases++;
            return new BrowserLease(this, _current);
        }
        finally
        {
            _lock.Release();
        }
    }

    private bool IsDue(BrowserInstance instance) =>
        instance.ContextsIssued >= _options.BrowserMaxContexts ||
        DateTime.UtcNow - instance.LaunchedAt >= TimeSpan.FromMinutes(_options.BrowserMaxAgeMinutes);

    private async Task<BrowserInstance> LaunchAsync()
    {
        _playwright ??= await Playwright.CreateAsync();

        // Every context brings its own guarded proxy. This browser-wide one is the fail-safe for anything
        // that would not use the context's proxy: it enforces the same public-addresses-only policy.
        var launchProxy = new GuardedForwardProxy(GuardedForwardProxy.ResolvePublicOnly);
        try
        {
            var browser = await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
            {
                Headless = true,
                Proxy = new Proxy { Server = launchProxy.Address },
                Args = ["--disable-blink-features=AutomationControlled"]
            });
            return new BrowserInstance(browser, launchProxy, BuildUserAgent(browser.Version));
        }
        catch
        {
            await launchProxy.DisposeAsync();
            throw;
        }
    }

    // The headless shell announces itself as "HeadlessChrome"; present as the regular Chrome of the same
    // version and platform instead, so the user agent stays consistent with what the engine actually does.
    private static string BuildUserAgent(string browserVersion)
    {
        var major = browserVersion.Split('.')[0];
        var platform = OperatingSystem.IsWindows() ? "Windows NT 10.0; Win64; x64"
            : OperatingSystem.IsMacOS() ? "Macintosh; Intel Mac OS X 10_15_7"
            : "X11; Linux x86_64";
        return $"Mozilla/5.0 ({platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{major}.0.0.0 Safari/537.36";
    }

    /// <summary>Takes the current browser out of rotation; it closes now if idle, else when its last lease ends.</summary>
    private async Task RetireCurrentAsync()
    {
        if (_current is null)
        {
            return;
        }

        var instance = _current;
        _current = null;
        if (instance.ActiveLeases == 0)
        {
            await instance.CloseAsync();
        }
        else
        {
            _retired.Add(instance);
        }
    }

    private async Task ReleaseAsync(BrowserInstance instance)
    {
        await _lock.WaitAsync();
        try
        {
            instance.ActiveLeases--;
            if (instance.ActiveLeases == 0 && _retired.Remove(instance))
            {
                await instance.CloseAsync();
            }
        }
        finally
        {
            _lock.Release();
        }
    }

    public async ValueTask DisposeAsync()
    {
        await _lock.WaitAsync();
        try
        {
            await RetireCurrentAsync();
            foreach (var instance in _retired)
            {
                await instance.CloseAsync();
            }

            _retired.Clear();
            _playwright?.Dispose();
            _playwright = null;
        }
        finally
        {
            _lock.Release();
        }
    }

    internal sealed class BrowserInstance(IBrowser browser, GuardedForwardProxy launchProxy, string userAgent)
    {
        public IBrowser Browser { get; } = browser;
        public string UserAgent { get; } = userAgent;
        public DateTime LaunchedAt { get; } = DateTime.UtcNow;
        public int ContextsIssued { get; set; }
        public int ActiveLeases { get; set; }

        public async Task CloseAsync()
        {
            try
            {
                await Browser.CloseAsync();
            }
            catch (PlaywrightException)
            {
                // already gone
            }

            await launchProxy.DisposeAsync();
        }
    }

    /// <summary>One preview's use of a browser. Disposing it lets a recycled browser close.</summary>
    public sealed class BrowserLease : IAsyncDisposable
    {
        private readonly PlaywrightBrowserProvider _provider;
        private readonly BrowserInstance _instance;
        private bool _released;

        internal BrowserLease(PlaywrightBrowserProvider provider, BrowserInstance instance)
        {
            _provider = provider;
            _instance = instance;
        }

        public IBrowser Browser => _instance.Browser;

        /// <summary>A regular desktop Chrome user agent matching this browser's real version.</summary>
        public string UserAgent => _instance.UserAgent;

        public async ValueTask DisposeAsync()
        {
            if (_released)
            {
                return;
            }

            _released = true;
            await _provider.ReleaseAsync(_instance);
        }
    }
}
