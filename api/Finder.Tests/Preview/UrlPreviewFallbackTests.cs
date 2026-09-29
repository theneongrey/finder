using Finder.Business.Preview.Services.PreviewHelper;
using Xunit;

namespace Finder.Tests.Preview;

public class UrlPreviewFallbackTests
{
    [Theory]
    [InlineData("https://www.booking.com/hotel/de/adlon-kempinski-berlin.de.html?aid=123", "Adlon Kempinski Berlin", "booking.com")]
    [InlineData("https://www.idealo.de/preisvergleich/OffersOfProduct/205787001_-iphone-17-pro-256gb-apple.html", "Iphone 17 Pro 256gb Apple", "idealo.de")]
    [InlineData("https://www.amazon.de/Bosch-Akkuschrauber-Schwarz/dp/B0FVX89SVD", "Bosch Akkuschrauber Schwarz", "amazon.de")]
    [InlineData("https://example.com/caf%C3%A9-de-flore", "Café De Flore", "example.com")]
    public void FromUrl_DerivesTitleFromTheSlug(string url, string expectedTitle, string expectedSite)
    {
        var preview = UrlPreviewFallback.FromUrl(new Uri(url));

        Assert.Equal(expectedTitle, preview.Title);
        Assert.Equal(expectedSite, preview.SiteName);
    }

    [Theory]
    [InlineData("https://example.com/")]
    [InlineData("https://example.com/dp/B0FVX89SVD")]
    [InlineData("https://example.com/index.html")]
    public void FromUrl_WithoutReadableSlug_LeavesTitleEmpty(string url)
    {
        var preview = UrlPreviewFallback.FromUrl(new Uri(url));

        Assert.Equal(string.Empty, preview.Title);
        Assert.Equal("example.com", preview.SiteName);
    }
}
