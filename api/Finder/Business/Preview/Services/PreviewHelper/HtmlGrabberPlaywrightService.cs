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
        var cancellationToken = new CancellationTokenSource();
        cancellationToken.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new()
        {
            Headless = true
        });

        var page = await browser.NewPageAsync();
        await page.GotoAsync(url);
        await page.WaitForLoadStateAsync(LoadState.Load, new()
        {
            Timeout = 3
        });
        // wait for a redirect
        await page.WaitForTimeoutAsync(1000);

        if (cancellationToken.IsCancellationRequested)
        {
            return Result<PlaywrightResult>.Fail();
        }

        await page.WaitForLoadStateAsync(LoadState.Load, new()
        {
            Timeout = 3
        });

        var html = await page.ContentAsync();
        Console.WriteLine("--------------------------------------------");
        Console.WriteLine(html);
        Console.WriteLine("--------------------------------------------");
        if (!html.Contains("html"))
        {
            return Result<PlaywrightResult>.Fail(500, "Failed to fetch from url");
        }

        return Result<PlaywrightResult>.Success(new PlaywrightResult(html, page.Url));
    }
}