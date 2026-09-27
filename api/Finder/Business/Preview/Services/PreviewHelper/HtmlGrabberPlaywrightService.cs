using System.Net;
using Finder.Business.Preview.Models;
using Finder.Business.Shared;
using Microsoft.Playwright;

namespace Finder.Business.Preview.Services.PreviewHelper;

public interface IHtmlGrabberPlaywrightService
{
    Task<Result<PlaywrightResult>> GetHtmlContent(string url);
}

public class HtmlGrabberPlaywrightService : IHtmlGrabberPlaywrightService
{
    private readonly IConfiguration _configuration;
    private readonly Func<string, int, CancellationToken, Task<IPAddress[]?>> _resolveAllowed;

    public HtmlGrabberPlaywrightService(IConfiguration configuration)
        : this(configuration, GuardedForwardProxy.ResolvePublicOnly)
    {
    }

    /// <summary>Test seam: replaces the SSRF address policy used by the browser's proxy.</summary>
    public HtmlGrabberPlaywrightService(IConfiguration configuration,
        Func<string, int, CancellationToken, Task<IPAddress[]?>> resolveAllowed)
    {
        _configuration = configuration;
        _resolveAllowed = resolveAllowed;
    }

    public async Task<Result<PlaywrightResult>> GetHtmlContent(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || !OutboundUrlGuard.IsAllowedScheme(uri))
        {
            return Result<PlaywrightResult>.Fail(400, "URL not allowed");
        }

        var timeoutSeconds = _configuration.GetValue<int?>("Preview:PlaywrightTimeoutSeconds") ?? 5;

        // SSRF guard: all browser traffic goes through a loopback proxy that only connects to public
        // addresses. Enforcing this at the network layer also covers redirects (which Playwright's
        // route handler never sees), sub-resources, WebSockets and DNS rebinding.
        await using var proxy = new GuardedForwardProxy(_resolveAllowed);

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new()
        {
            Headless = true,
            // Playwright adds <-loopback> to the bypass list, so localhost targets go through the proxy too.
            Proxy = new Proxy { Server = proxy.Address },
            Args = new[]
            {
                "--disable-blink-features=AutomationControlled",
                "--disable-features=IsolateOrigins,site-per-process"
            }
        });

        var context = await browser.NewContextAsync(new BrowserNewContextOptions
        {
            UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            Locale = "en-US",
            TimezoneId = "Europe/Berlin",
            ViewportSize = new ViewportSize { Width = 1920, Height = 1080 },
            ExtraHTTPHeaders = new Dictionary<string, string>
            {
                ["Accept-Language"] = "en-US,en;q=0.9"
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

        var page = await context.NewPageAsync();
        try
        {
            await page.GotoAsync(url, new PageGotoOptions
            {
                WaitUntil = WaitUntilState.Commit
            });
        }
        catch (PlaywrightException ex) when (ex.Message.Contains("ERR_BLOCKED_BY_CLIENT") ||
                                             ex.Message.Contains("ERR_TUNNEL_CONNECTION_FAILED"))
        {
            return Result<PlaywrightResult>.Fail(400, "URL not allowed");
        }

        // Wait until navigation activity has settled.
        await WaitForPageToSettleAsync(page, 500, timeoutSeconds);

        // For plain http the proxy's refusal renders as a page; never hand that back as content.
        if (proxy.WasBlocked(page.Url))
        {
            return Result<PlaywrightResult>.Fail(400, "URL not allowed");
        }

        var html = await page.ContentAsync();
        if (!html.Contains("html"))
        {
            return Result<PlaywrightResult>.Fail(500, "Failed to fetch from url");
        }

        return Result<PlaywrightResult>.Success(new PlaywrightResult(html, page.Url));
    }

    private static async Task WaitForPageToSettleAsync(IPage page, int settleTimeMs, int timeoutSeconds)
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
            var timeout = TimeSpan.FromSeconds(timeoutSeconds);

            while (DateTime.UtcNow - lastNavigation < timeout)
            {
                await page.WaitForTimeoutAsync(100);

                if (DateTime.UtcNow - lastNavigation >=
                    TimeSpan.FromMilliseconds(settleTimeMs))
                {
                    // Navigation has stopped; now give client-side frameworks
                    // (SPAs) a chance to render before we read the DOM. Waiting
                    // only for LoadState.Load captures the empty shell of an
                    // Angular/React app before its bundles execute, so wait for
                    // the network to go idle instead. If it never fully settles
                    // (long-polling, analytics beacons, …), fall back to
                    // whatever has rendered rather than failing the grab.
                    try
                    {
                        await page.WaitForLoadStateAsync(
                            LoadState.NetworkIdle,
                            new PageWaitForLoadStateOptions
                            {
                                Timeout = (float)TimeSpan
                                    .FromSeconds(timeoutSeconds).TotalMilliseconds
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
                $"Navigation did not settle within {timeoutSeconds}s. " +
                $"Current URL: {page.Url}");
        }
        finally
        {
            page.FrameNavigated -= OnFrameNavigated;
        }
    }
}