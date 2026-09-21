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

    public HtmlGrabberPlaywrightService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<Result<PlaywrightResult>> GetHtmlContent(string url)
    {
        var timeoutSeconds = _configuration.GetValue<int?>("Preview:PlaywrightTimeoutSeconds") ?? 5;

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new()
        {
            Headless = true,
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

        var page = await context.NewPageAsync();
        await page.GotoAsync(url, new PageGotoOptions
        {
            WaitUntil = WaitUntilState.Commit
        });

        // Wait until navigation activity has settled.
        await WaitForPageToSettleAsync(page, 500, timeoutSeconds);

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