using Finder.Business.Shared;
using Microsoft.Playwright;

namespace Finder.Business.Preview.Services.PreviewHelper;

public class HtmlGrabberPlaywrightService(IConfiguration configuration)
{
    public async Task<Result<string>> GetHtmlContent(string url)
    {
        var timeoutSeconds = configuration.GetValue<int?>("Preview:PlaywrightTimeoutSeconds") ?? 5;
        var cancellationToken = new CancellationTokenSource();
        cancellationToken.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));
        
        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new()
        {
            Headless = true
        });
        
        var page = await browser.NewPageAsync();
        await page.GotoAsync(url);
        await page.WaitForLoadStateAsync(LoadState.Load, new ()
        {
            Timeout = 3
        });
        // wait for a redirect
        await page.WaitForTimeoutAsync(1000);
        
        if (cancellationToken.IsCancellationRequested)
        {
            return Result<string>.Fail();
        }
        
        await page.WaitForLoadStateAsync(LoadState.Load, new ()
        {
            Timeout = 3
        });
        
        var html = await page.ContentAsync();
        Console.WriteLine("--------------------------------------------");
        Console.WriteLine(html);
        Console.WriteLine("--------------------------------------------");
        if (!html.Contains("html"))
        {
            return Result<string>.Fail(500, "Failed to fetch from url");
        }
        
        return Result<string>.Success(html);
    }
}