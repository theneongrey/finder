using System.Net;
using System.Net.Http.Json;
using Finder.Tests.Infrastructure;
using Xunit;

namespace Finder.Tests.Preview;

public class PreviewApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public PreviewApiTests(FinderApiFactory factory) => _factory = factory;

    [Fact(Skip = "currently not in use")]
    //[Fact]
    public async Task GetPreview_WithMockedServices_ReturnsPreviewWithTitleAndImage()
    {
        var mockHtml = await File.ReadAllTextAsync(
            Path.Combine(AppContext.BaseDirectory, "Preview", "Resources", "playwright_mock.html"));

        /*
        var httpGrabber = Substitute.For<IHtmlGrabberHttpClientService>();
        httpGrabber.GetHtmlContent(Arg.Any<string>())
            .Returns(Result<string>.Fail(500, string.Empty));

        var playwrightGrabber = Substitute.For<IHtmlGrabberPlaywrightService>();
        playwrightGrabber.GetHtmlContent(Arg.Any<string>())
            .Returns(Result<PlaywrightResult>.Success(new  (mockHtml, "https://www.amazon.de/dp/B0FVX89SVD?ref=cm_sw_r_cso_cp_apin_dp_Y8GHHFGB7B0Z8HCR2A36&ref_=cm_sw_r_cso_cp_apin_dp_Y8GHHFGB7B0Z8HCR2A36&social_share=cm_sw_r_cso_cp_apin_dp_Y8GHHFGB7B0Z8HCR2A36&th=1")));

        var user = await _factory.SeedUser();

        using var client = _factory
            .WithMockedHtmlGrabbers(httpGrabber, playwrightGrabber)
            .CreateClient();
        /*/
        var user = await _factory.SeedUser();
        using var client = _factory.CreateClient();
        //*/

        client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, user.Id.ToString());

        const string url = "https://www.amazon.de/dp/B0FVX89SVD?ref=cm_sw_r_cso_cp_apin_dp_Y8GHHFGB7B0Z8HCR2A36&ref_=cm_sw_r_cso_cp_apin_dp_Y8GHHFGB7B0Z8HCR2A36&social_share=cm_sw_r_cso_cp_apin_dp_Y8GHHFGB7B0Z8HCR2A36&th=1";
        var response = await client.GetAsync($"/api/preview?url={Uri.EscapeDataString(url)}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var preview = await response.Content.ReadFromJsonAsync<PreviewResponse>();
        Assert.NotNull(preview);
        Assert.False(string.IsNullOrWhiteSpace(preview.Title));
        Assert.False(string.IsNullOrWhiteSpace(preview.ImageUrl));
    }

    private record PreviewResponse(string Title, string Description, string ImageUrl, string SiteName);
}
