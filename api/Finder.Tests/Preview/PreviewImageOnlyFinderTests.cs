using Finder.Business.Preview.Services.PreviewHelper;
using HtmlAgilityPack;
using Xunit;

namespace Finder.Tests.Preview;

public class PreviewImageOnlyFinderTests
{
    private static readonly Uri PageUrl = new("https://shop.example.com/products/chair");

    private static IReadOnlyList<string> Rank(string html, string? title = null) => RankWithSource(html, title).Urls;

    private static RankedImages RankWithSource(string html, string? title = null)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);
        return new PreviewImageOnlyFinder().GetRankedImages(doc, title, PageUrl);
    }

    [Fact]
    public void GetRankedImages_WithoutImages_ReturnsEmpty()
    {
        Assert.Empty(Rank("<html><body><p>No pictures here</p></body></html>"));
    }

    [Fact]
    public void GetRankedImages_PicksTheLargestSrcSetEntry()
    {
        var images = Rank("""<img srcset="/small.jpg 320w, /large.jpg 1280w, /medium.jpg 640w" alt="Chair">""");

        Assert.Equal("https://shop.example.com/large.jpg", images[0]);
    }

    [Fact]
    public void GetRankedImages_UsesLazyLoadingAttributes()
    {
        var images = Rank("""<img src="data:image/gif;base64,R0lGOD" data-lazy-src="/lazy.jpg">""");

        Assert.Equal(["https://shop.example.com/lazy.jpg"], images);
    }

    [Fact]
    public void GetRankedImages_PrefersTitleMatchesAndDemotesLogos()
    {
        var images = Rank("""
            <img src="/logo.png" width="800" height="800" alt="Shop logo">
            <img src="/misc.jpg" width="300" height="300">
            <img src="/p/123.jpg" alt="Vintage oak dining chair">
            <img src="/icons/cart.png">
            """, title: "Vintage Oak Dining Chair");

        Assert.Equal("https://shop.example.com/p/123.jpg", images[0]);
        Assert.Equal("https://shop.example.com/logo.png", images[^1]);
        Assert.DoesNotContain("https://shop.example.com/icons/cart.png", images);
    }

    [Fact]
    public void GetRankedImages_ForAmazonPage_ReturnsTheLargestDynamicImage()
    {
        var html = File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Preview", "Resources", "playwright_mock.html"));

        var images = RankWithSource(html);

        Assert.True(images.IsSiteSpecific);
        Assert.NotEmpty(images.Urls);
        Assert.Contains("amazon", images.Urls[0], StringComparison.OrdinalIgnoreCase);
    }
}
