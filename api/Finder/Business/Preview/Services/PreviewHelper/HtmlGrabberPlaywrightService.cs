using Finder.Business.Shared;
using Microsoft.Playwright;

namespace Finder.Business.Preview.Services.PreviewHelper;
    
public class HtmlGrabberPlaywrightService
{
    public async Task<Result<string>> GetHtmlContent(string url)
    {
        var cancellationToken = new CancellationTokenSource();
        // try to avoid waiting for more than 3 seconds in total
        cancellationToken.CancelAfter(TimeSpan.FromSeconds(5));
        
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
        await page.WaitForTimeoutAsync(500);
        
        if (cancellationToken.IsCancellationRequested)
        {
            return Result<string>.Fail();
        }
        
        await page.WaitForLoadStateAsync(LoadState.Load, new ()
        {
            Timeout = 3
        });
        
        var html = await page.ContentAsync();
        if (!html.Contains("html"))
        {
            return Result<string>.Fail(500, "Failed to fetch from url");
        }
        
        return Result<string>.Success(html);
    }
}