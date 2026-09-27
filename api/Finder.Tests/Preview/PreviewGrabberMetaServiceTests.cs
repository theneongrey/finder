using Finder.Business.Preview.Services.PreviewHelper;
using HtmlAgilityPack;
using Xunit;

namespace Finder.Tests.Preview;

public class PreviewGrabberMetaServiceTests
{
    private static Business.Preview.Models.Preview Extract(string html, string url = "https://shop.example.com/products/42")
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);
        return new PreviewGrabberMetaService().GetPreview(doc, new Uri(url));
    }

    [Fact]
    public void GetPreview_ReadsOpenGraphTags()
    {
        var preview = Extract("""
            <html><head>
              <meta property="og:title" content="Blue Chair &amp; Table">
              <meta property="og:description" content="A lovely chair">
              <meta property="og:image" content="/img/chair.jpg">
              <meta property="og:site_name" content="Example Shop">
            </head></html>
            """);

        Assert.Equal("Blue Chair & Table", preview.Title);
        Assert.Equal("A lovely chair", preview.Description);
        Assert.Equal("https://shop.example.com/img/chair.jpg", preview.ImageUrl);
        Assert.Equal("Example Shop", preview.SiteName);
    }

    [Fact]
    public void GetPreview_WithoutAnyTitleTag_KeepsTheOtherFields()
    {
        var preview = Extract("""
            <html><head><meta name="Description" content="Only a description"></head>
            <body><p>short</p></body></html>
            """);

        Assert.Equal(string.Empty, preview.Title);
        Assert.Equal("Only a description", preview.Description);
        Assert.Equal("shop.example.com", preview.SiteName);
    }

    [Fact]
    public void GetPreview_FallsBackToHeadingAndFirstParagraph()
    {
        var preview = Extract("""
            <html><body><main>
              <h1>  Weekend in   Lisbon </h1>
              <p>Tiny</p>
              <p>Three days of tiled streets, custard tarts and sunsets over the river — here is our plan.</p>
            </main></body></html>
            """);

        Assert.Equal("Weekend in Lisbon", preview.Title);
        Assert.StartsWith("Three days of tiled streets", preview.Description);
    }

    [Fact]
    public void GetPreview_SkipsCookieBannerParagraphs()
    {
        var preview = Extract("""
            <html><body>
              <div id="cookie-consent"><p>We use cookies and similar technologies to improve your experience here.</p></div>
              <p>Our recipe for a creamy carbonara without cream, ready in twenty minutes on a weeknight.</p>
            </body></html>
            """);

        Assert.StartsWith("Our recipe for a creamy carbonara", preview.Description);
    }

    [Fact]
    public void GetPreview_UsesJsonLdWhenOpenGraphIsMissing()
    {
        var preview = Extract("""
            <html><head>
              <title>Some page</title>
              <script type="application/ld+json">
                { "@context": "https://schema.org", "@graph": [
                  { "@type": "BreadcrumbList", "name": "Crumbs" },
                  { "@type": "Hotel", "name": "Hotel Adlon", "description": "Luxury at the Brandenburg Gate",
                    "image": [{ "@type": "ImageObject", "url": "https://cdn.example.com/adlon.jpg" }] }
                ] }
              </script>
            </head></html>
            """);

        Assert.Equal("Hotel Adlon", preview.Title);
        Assert.Equal("Luxury at the Brandenburg Gate", preview.Description);
        Assert.Equal("https://cdn.example.com/adlon.jpg", preview.ImageUrl);
    }

    [Fact]
    public void GetPreview_IgnoresMalformedJsonLd()
    {
        var preview = Extract("""
            <html><head><title>Fine</title><script type="application/ld+json">{ not json </script></head></html>
            """);

        Assert.Equal("Fine", preview.Title);
    }

    [Fact]
    public void GetPreview_ResolvesRelativeImagesAgainstBaseHref()
    {
        var preview = Extract("""
            <html><head><base href="https://cdn.example.com/assets/">
            <meta name="twitter:image" content="chair.png"></head></html>
            """);

        Assert.Equal("https://cdn.example.com/assets/chair.png", preview.ImageUrl);
    }

    [Theory]
    [InlineData("Hotel Adlon Kempinski | Booking.com", "https://www.booking.com/hotel/de/adlon.html", "Hotel Adlon Kempinski")]
    [InlineData("Dune - Part Two", "https://movies.example.com/dune", "Dune - Part Two")]
    [InlineData("Espresso Maker – Shop – Example", "https://example.com/p/1", "Espresso Maker – Shop")]
    public void GetPreview_StripsTheSiteNameSuffixOnly(string title, string url, string expected)
    {
        var preview = Extract($"<html><head><title>{title}</title></head></html>", url);

        Assert.Equal(expected, preview.Title);
    }

    [Fact]
    public void GetPreview_ForEmptyDocument_DoesNotThrow()
    {
        var preview = Extract(string.Empty);

        Assert.False(preview.HasTitle);
        Assert.False(preview.HasImage);
    }
}
