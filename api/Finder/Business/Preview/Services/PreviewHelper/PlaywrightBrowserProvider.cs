using Microsoft.Playwright;

namespace Finder.Business.Preview.Services.PreviewHelper;

/// <summary>
/// Keeps one headless Chromium alive for the lifetime of the app. Starting the Playwright driver and a browser
/// costs seconds, while a fresh <see cref="IBrowserContext"/> per preview costs milliseconds and still isolates
/// cookies and storage between requests. The browser is relaunched if it crashes or disconnects.
/// </summary>
public sealed class PlaywrightBrowserProvider : IAsyncDisposable
{
    private readonly SemaphoreSlim _lock = new(1, 1);
    private IPlaywright? _playwright;
    private IBrowser? _browser;
    private GuardedForwardProxy? _launchProxy;

    /// <summary>A regular desktop Chrome user agent matching the launched browser's real version.</summary>
    public string UserAgent { get; private set; } = string.Empty;

    public async Task<IBrowser> GetBrowserAsync()
    {
        if (_browser is { IsConnected: true })
        {
            return _browser;
        }

        await _lock.WaitAsync();
        try
        {
            if (_browser is { IsConnected: true })
            {
                return _browser;
            }

            await CloseBrowserAsync();

            _playwright ??= await Playwright.CreateAsync();

            // Every context brings its own guarded proxy. This browser-wide one is the fail-safe for anything
            // that would not use the context's proxy: it enforces the same public-addresses-only policy.
            _launchProxy = new GuardedForwardProxy(GuardedForwardProxy.ResolvePublicOnly);
            _browser = await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
            {
                Headless = true,
                Proxy = new Proxy { Server = _launchProxy.Address },
                Args =
                [
                    "--disable-blink-features=AutomationControlled",
                    "--disable-features=IsolateOrigins,site-per-process"
                ]
            });
            UserAgent = BuildUserAgent(_browser.Version);

            return _browser;
        }
        finally
        {
            _lock.Release();
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

    private async Task CloseBrowserAsync()
    {
        if (_browser is not null)
        {
            try
            {
                await _browser.CloseAsync();
            }
            catch (PlaywrightException)
            {
                // already gone
            }

            _browser = null;
        }

        if (_launchProxy is not null)
        {
            await _launchProxy.DisposeAsync();
            _launchProxy = null;
        }
    }

    public async ValueTask DisposeAsync()
    {
        await _lock.WaitAsync();
        try
        {
            await CloseBrowserAsync();
            _playwright?.Dispose();
            _playwright = null;
        }
        finally
        {
            _lock.Release();
        }
    }
}
