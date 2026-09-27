using System.Net;
using Finder.Business.Preview.Models;
using Finder.Business.Preview.Setup;
using Finder.Business.Shared;
using Microsoft.Extensions.Options;
using Microsoft.Playwright;

namespace Finder.Business.Preview.Services.PreviewHelper;

public interface IHtmlGrabberPlaywrightService
{
    Task<Result<FetchedHtml>> GetHtmlContent(string url, string acceptLanguage);
}

public class HtmlGrabberPlaywrightService : IHtmlGrabberPlaywrightService
{
    private const int NavigationSettleMilliseconds = 500;

    // Only the DOM is read, so skip everything that only matters for painting the page.
    private static readonly HashSet<string> BlockedResourceTypes = ["image", "media", "font", "stylesheet"];

    private readonly PreviewOptions _options;
    private readonly PlaywrightBrowserProvider _browserProvider;
    private readonly Func<string, int, CancellationToken, Task<IPAddress[]?>> _resolveAllowed;

    public HtmlGrabberPlaywrightService(IOptions<PreviewOptions> options, PlaywrightBrowserProvider browserProvider)
        : this(options, browserProvider, GuardedForwardProxy.ResolvePublicOnly)
    {
    }

    /// <summary>Test seam: replaces the SSRF address policy used by the browser's proxy.</summary>
    public HtmlGrabberPlaywrightService(IOptions<PreviewOptions> options, PlaywrightBrowserProvider browserProvider,
        Func<string, int, CancellationToken, Task<IPAddress[]?>> resolveAllowed)
    {
        _options = options.Value;
        _browserProvider = browserProvider;
        _resolveAllowed = resolveAllowed;
    }

    public async Task<Result<FetchedHtml>> GetHtmlContent(string url, string acceptLanguage)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || !OutboundUrlGuard.IsAllowedScheme(uri))
        {
            return Result<FetchedHtml>.Fail(400, "URL not allowed");
        }

        // SSRF guard: all browser traffic goes through a loopback proxy that only connects to public
        // addresses. Enforcing this at the network layer also covers redirects (which Playwright's
        // route handler never sees), sub-resources, WebSockets and DNS rebinding.
        await using var proxy = new GuardedForwardProxy(_resolveAllowed);

        var browser = await _browserProvider.GetBrowserAsync();
        await using var context = await browser.NewContextAsync(new BrowserNewContextOptions
        {
            // Playwright adds <-loopback> to the bypass list, so localhost targets go through the proxy too.
            Proxy = new Proxy { Server = proxy.Address },
            UserAgent = _browserProvider.UserAgent,
            Locale = PreviewLanguage.PrimaryLocale(acceptLanguage),
            TimezoneId = "Europe/Berlin",
            ViewportSize = new ViewportSize { Width = 1920, Height = 1080 },
            ExtraHTTPHeaders = new Dictionary<string, string>
            {
                ["Accept-Language"] = acceptLanguage
            }
        });

        // Mask the most obvious automation tells before any page script runs.
        await context.AddInitScriptAsync(
            "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });");

        // Non-network schemes (file:, ftp:, …) never reach the proxy, so block them in the browser.
        await context.RouteAsync(
            request => !Uri.TryCreate(request, UriKind.Absolute, out var target) ||
                       !(OutboundUrlGuard.IsAllowedScheme(target) || target.Scheme is "data" or "blob"),
            route => route.AbortAsync("blockedbyclient"));

        // Registered last, so it runs first; everything it lets through falls back to the scheme guard above.
        await context.RouteAsync("**/*", route =>
            BlockedResourceTypes.Contains(route.Request.ResourceType)
                ? route.AbortAsync("blockedbyclient")
                : route.FallbackAsync());

        var page = await context.NewPageAsync();
        try
        {
            await page.GotoAsync(url, new PageGotoOptions
            {
                WaitUntil = WaitUntilState.Commit,
                Timeout = (float)TimeSpan.FromSeconds(_options.PlaywrightTimeoutSeconds).TotalMilliseconds
            });
        }
        catch (PlaywrightException ex) when (ex.Message.Contains("ERR_BLOCKED_BY_CLIENT") ||
                                             ex.Message.Contains("ERR_TUNNEL_CONNECTION_FAILED"))
        {
            return Result<FetchedHtml>.Fail(400, "URL not allowed");
        }
        catch (Exception ex) when (ex is PlaywrightException or TimeoutException)
        {
            return Result<FetchedHtml>.Fail(502, "Failed to fetch from url");
        }

        try
        {
            // Wait until navigation activity has settled.
            await WaitForPageToSettleAsync(page);

            // For plain http the proxy's refusal renders as a page; never hand that back as content.
            if (proxy.WasBlocked(page.Url))
            {
                return Result<FetchedHtml>.Fail(400, "URL not allowed");
            }

            var html = await page.ContentAsync();
            if (!html.Contains("html"))
            {
                return Result<FetchedHtml>.Fail(500, "Failed to fetch from url");
            }

            return Result<FetchedHtml>.Success(new FetchedHtml(html, page.Url));
        }
        catch (Exception ex) when (ex is PlaywrightException or TimeoutException)
        {
            // Navigation never settled (endless redirects) or the page crashed/closed mid-read.
            return Result<FetchedHtml>.Fail(504, "Page did not settle in time");
        }
    }

    private async Task WaitForPageToSettleAsync(IPage page)
    {
        var lastNavigation = DateTime.UtcNow;

        void OnFrameNavigated(object? sender, IFrame frame)
        {
            if (frame == page.MainFrame)
            {
                lastNavigation = DateTime.UtcNow;
            }
        }

        page.FrameNavigated += OnFrameNavigated;

        try
        {
            var timeout = TimeSpan.FromSeconds(_options.PlaywrightTimeoutSeconds);

            while (DateTime.UtcNow - lastNavigation < timeout)
            {
                await page.WaitForTimeoutAsync(100);

                if (DateTime.UtcNow - lastNavigation >=
                    TimeSpan.FromMilliseconds(NavigationSettleMilliseconds))
                {
                    // Navigation has stopped; now give client-side frameworks
                    // (SPAs) a chance to render before we read the DOM. Waiting
                    // only for LoadState.Load captures the empty shell of an
                    // Angular/React app before its bundles execute, so wait for
                    // the network to go idle instead. Many pages never fully settle
                    // (long-polling, analytics beacons, …), so this wait is capped
                    // short and then we use whatever has rendered.
                    try
                    {
                        await page.WaitForLoadStateAsync(
                            LoadState.NetworkIdle,
                            new PageWaitForLoadStateOptions
                            {
                                Timeout = _options.PlaywrightNetworkIdleMilliseconds
                            });
                    }
                    catch (TimeoutException)
                    {
                        // Network stayed busy; use the DOM as-is.
                    }

                    return;
                }
            }

            throw new TimeoutException(
                $"Navigation did not settle within {_options.PlaywrightTimeoutSeconds}s. " +
                $"Current URL: {page.Url}");
        }
        finally
        {
            page.FrameNavigated -= OnFrameNavigated;
        }
    }
}
