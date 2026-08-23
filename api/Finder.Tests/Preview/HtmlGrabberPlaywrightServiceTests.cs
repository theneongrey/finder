using Finder.Business.Preview.Services.PreviewHelper;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Finder.Tests.Preview;

public class HtmlGrabberPlaywrightServiceTests
{
    [Fact]
    public async Task GetHtmlContent_ForRealUrl_ReturnsHtml()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Preview:PlaywrightTimeoutSeconds"] = "20" })
            .Build();
        var service = new HtmlGrabberPlaywrightService(config);

        var result = await service.GetHtmlContent("http://pixel-fusion.de");

        Assert.True(result.IsSuccess, $"Expected success but got code {result.Code}: {result.ErrorMessasge}");
        Assert.NotNull(result.Payload);
        Assert.Contains("app-home", result.Payload, StringComparison.OrdinalIgnoreCase);
    }
}
