using Finder.Business.Preview.Services.PreviewHelper;
using Finder.Business.Preview.Setup;
using Microsoft.Extensions.Options;
using Xunit;

namespace Finder.Tests.Preview;

public class HtmlGrabberPlaywrightServiceTests : IAsyncLifetime
{
    private readonly PlaywrightBrowserProvider _browserProvider = new();

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync() => await _browserProvider.DisposeAsync();

    private HtmlGrabberPlaywrightService CreateService() =>
        new(Options.Create(new PreviewOptions { PlaywrightTimeoutSeconds = 20 }), _browserProvider);

    [Fact]
    public async Task GetHtmlContent_ForRealUrl_ReturnsHtml()
    {
        var result = await CreateService().GetHtmlContent("http://pixel-fusion.de", PreviewLanguage.Default);

        Assert.True(result.IsSuccess, $"Expected success but got code {result.Code}: {result.ErrorMessasge}");
        Assert.NotNull(result.Payload);
        Assert.Contains("app-home", result.Payload.HtmlContent, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetHtmlContent_ForRedirectingUrl_FollowsRedirectAndReturnsHtml()
    {
        var result = await CreateService().GetHtmlContent("https://amzn.eu/d/0i3d9Aln", PreviewLanguage.Default);

        Assert.True(result.IsSuccess, $"Expected success but got code {result.Code}: {result.ErrorMessasge}");
        Assert.NotNull(result.Payload);
        // The short link redirects to a full amazon.* product page.
        Assert.Contains("amazon", result.Payload.Url, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("<html", result.Payload.HtmlContent, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetHtmlContent_ReusesTheBrowserAcrossRequests()
    {
        var service = CreateService();

        var first = await service.GetHtmlContent("http://pixel-fusion.de", PreviewLanguage.Default);
        var browser = await _browserProvider.GetBrowserAsync();
        var second = await service.GetHtmlContent("http://pixel-fusion.de", PreviewLanguage.Default);

        Assert.True(first.IsSuccess && second.IsSuccess);
        Assert.Same(browser, await _browserProvider.GetBrowserAsync());
    }
}
