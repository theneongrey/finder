using Finder.Business.Preview.Models;
using Finder.Business.Preview.Services;
using Finder.Business.Preview.Services.PreviewHelper;
using Finder.Business.Preview.Setup;
using Finder.Business.Shared;
using HtmlAgilityPack;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using Xunit;

namespace Finder.Tests.Preview;

public class PreviewServiceTests
{
    // IP-literal hosts: the SSRF pre-check needs no DNS lookup, so these tests stay offline.
    private const string HotelUrl = "http://8.8.8.8/hotel/de/adlon-kempinski-berlin.de.html";

    private readonly IHtmlGrabberHttpClientService _http = Substitute.For<IHtmlGrabberHttpClientService>();
    private readonly IHtmlGrabberPlaywrightService _browser = Substitute.For<IHtmlGrabberPlaywrightService>();
    private readonly IPreviewImageCandidateService _images = Substitute.For<IPreviewImageCandidateService>();

    private PreviewService CreateService() =>
        new(_http, new PreviewGrabberMetaService(), _browser, _images,
            new MemoryCache(new MemoryCacheOptions()), Options.Create(new PreviewOptions()),
            NullLogger<PreviewService>.Instance);

    private void HttpReturns(string html, string url = HotelUrl) =>
        _http.GetHtmlContent(Arg.Any<string>(), Arg.Any<string>())
            .Returns(Result<FetchedHtml>.Success(new FetchedHtml(html, url)));

    private void HttpFails(int code = 403) =>
        _http.GetHtmlContent(Arg.Any<string>(), Arg.Any<string>()).Returns(Result<FetchedHtml>.Fail(code, "blocked"));

    private void BrowserReturns(string html, string url = HotelUrl) =>
        _browser.GetHtmlContent(Arg.Any<string>(), Arg.Any<string>())
            .Returns(Result<FetchedHtml>.Success(new FetchedHtml(html, url)));

    private void BrowserFails(int code = 504) =>
        _browser.GetHtmlContent(Arg.Any<string>(), Arg.Any<string>()).Returns(Result<FetchedHtml>.Fail(code, "failed"));

    [Fact]
    public async Task CompleteHttpPreview_SkipsTheBrowser()
    {
        HttpReturns("""<html><head><meta property="og:title" content="Adlon"><meta property="og:image" content="/a.jpg"></head></html>""");

        var result = await CreateService().GetPreviewAsync(HotelUrl);

        Assert.True(result.IsSuccess);
        Assert.Equal("Adlon", result.Payload!.Title);
        Assert.Equal("http://8.8.8.8/a.jpg", result.Payload.ImageUrl);
        await _browser.DidNotReceiveWithAnyArgs().GetHtmlContent(default!, default!);
    }

    [Fact]
    public async Task PreviewWithoutImage_IsStillReturned_WhenTheBrowserFails()
    {
        HttpReturns("""<html><head><title>Adlon</title><meta name="description" content="Luxury hotel"></head></html>""");
        BrowserFails();

        var result = await CreateService().GetPreviewAsync(HotelUrl);

        Assert.True(result.IsSuccess);
        Assert.Equal("Adlon", result.Payload!.Title);
        Assert.Equal("Luxury hotel", result.Payload.Description);
        Assert.Equal(string.Empty, result.Payload.ImageUrl);
    }

    [Fact]
    public async Task ImageFoundInMarkup_CompletesThePreview()
    {
        HttpReturns("""<html><head><title>Adlon</title></head><body><img src="/lobby.jpg"></body></html>""");
        _images.FindImageAsync(Arg.Any<HtmlDocument>(), Arg.Any<string?>(), Arg.Any<Uri>()).Returns("http://8.8.8.8/lobby.jpg");

        var result = await CreateService().GetPreviewAsync(HotelUrl);

        Assert.Equal("http://8.8.8.8/lobby.jpg", result.Payload!.ImageUrl);
        await _browser.DidNotReceiveWithAnyArgs().GetHtmlContent(default!, default!);
    }

    [Fact]
    public async Task BlockedEverywhere_FallsBackToTheUrl()
    {
        HttpFails();
        BrowserFails(502);

        var result = await CreateService().GetPreviewAsync(HotelUrl);

        Assert.True(result.IsSuccess);
        Assert.Equal("Adlon Kempinski Berlin", result.Payload!.Title);
        Assert.Equal("8.8.8.8", result.Payload.SiteName);
    }

    [Fact]
    public async Task BrowserPage_FillsWhatHttpMissed()
    {
        HttpReturns("<html><head><title>Loading…</title></head><body><app-root></app-root></body></html>");
        BrowserReturns("""
            <html><head><title>Adlon</title><meta property="og:image" content="https://cdn.test/adlon.jpg">
            <meta property="og:description" content="Rendered description"></head>
            <body><app-root><h1>Adlon</h1><p>Lots of client-rendered content that makes this page larger.</p></app-root></body></html>
            """, "http://8.8.8.8/hotel/adlon");

        var result = await CreateService().GetPreviewAsync(HotelUrl);

        Assert.Equal("Adlon", result.Payload!.Title);
        Assert.Equal("Rendered description", result.Payload.Description);
        Assert.Equal("https://cdn.test/adlon.jpg", result.Payload.ImageUrl);
        Assert.Equal("http://8.8.8.8/hotel/adlon", result.Payload.Url);
    }

    [Fact]
    public async Task BrowserRefusal_WithoutHttpContent_Fails()
    {
        HttpFails(500);
        BrowserFails(400);

        var result = await CreateService().GetPreviewAsync(HotelUrl);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.Code);
    }

    [Theory]
    [InlineData("http://127.0.0.1/admin")]
    [InlineData("http://169.254.169.254/latest/meta-data/")]
    [InlineData("file:///etc/passwd")]
    [InlineData("not a url")]
    public async Task UnsafeUrl_IsRejectedWithoutFetching(string url)
    {
        var result = await CreateService().GetPreviewAsync(url);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.Code);
        await _http.DidNotReceiveWithAnyArgs().GetHtmlContent(default!, default!);
    }

    [Fact]
    public async Task RepeatedRequests_AreServedFromCache()
    {
        HttpReturns("""<html><head><meta property="og:title" content="Adlon"><meta property="og:image" content="/a.jpg"></head></html>""");
        var service = CreateService();

        await service.GetPreviewAsync(HotelUrl, "de-DE,de;q=0.9");
        var second = await service.GetPreviewAsync(HotelUrl, "de-DE,de;q=0.9");

        Assert.Equal("Adlon", second.Payload!.Title);
        await _http.Received(1).GetHtmlContent(Arg.Any<string>(), Arg.Any<string>());
    }

    [Fact]
    public async Task UrlOnlyFallback_IsNotCached()
    {
        HttpFails();
        BrowserFails();
        var service = CreateService();

        await service.GetPreviewAsync(HotelUrl);
        await service.GetPreviewAsync(HotelUrl);

        await _http.Received(2).GetHtmlContent(Arg.Any<string>(), Arg.Any<string>());
    }

    [Fact]
    public async Task AcceptLanguage_IsForwardedToTheFetchers()
    {
        HttpReturns("""<html><head><meta property="og:title" content="Adlon"><meta property="og:image" content="/a.jpg"></head></html>""");

        await CreateService().GetPreviewAsync(HotelUrl, "de-DE,de;q=0.9");

        await _http.Received(1).GetHtmlContent(HotelUrl, "de-DE,de;q=0.9");
    }
}
