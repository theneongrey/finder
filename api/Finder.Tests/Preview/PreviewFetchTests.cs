using System.Net;
using System.Net.Http.Headers;
using System.Text;
using Finder.Business.Preview.Services.PreviewHelper;
using NSubstitute;
using Xunit;

namespace Finder.Tests.Preview;

public class PreviewFetchTests
{
    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        public HttpRequestMessage? LastRequest { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
            return Task.FromResult(respond(request));
        }
    }

    private static IHttpClientFactory FactoryFor(HttpMessageHandler handler)
    {
        var factory = Substitute.For<IHttpClientFactory>();
        factory.CreateClient(Arg.Any<string>()).Returns(_ => new HttpClient(handler, disposeHandler: false));
        return factory;
    }

    [Fact]
    public async Task HttpGrabber_ReturnsTheFinalUrlAfterRedirects()
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("<html><head><title>x</title></head></html>", Encoding.UTF8, "text/html"),
            RequestMessage = new HttpRequestMessage(HttpMethod.Get, "https://www.amazon.de/dp/B0FVX89SVD")
        });

        var result = await new HtmlGrabberHttpClientService(FactoryFor(handler))
            .GetHtmlContent("https://amzn.eu/d/abc", "de-DE");

        Assert.True(result.IsSuccess);
        Assert.Equal("https://www.amazon.de/dp/B0FVX89SVD", result.Payload!.Url);
        Assert.Equal("de-DE", handler.LastRequest!.Headers.AcceptLanguage.ToString());
    }

    [Fact]
    public async Task HttpGrabber_DecodesTheCharsetDeclaredInMarkup()
    {
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        var bytes = Encoding.GetEncoding("windows-1252")
            .GetBytes("<html><head><meta charset=\"windows-1252\"><title>Müller Größe</title></head></html>");
        var handler = new StubHandler(_ =>
        {
            var content = new ByteArrayContent(bytes);
            content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = content };
        });

        var result = await new HtmlGrabberHttpClientService(FactoryFor(handler))
            .GetHtmlContent("https://example.com/", PreviewLanguage.Default);

        Assert.Contains("Müller Größe", result.Payload!.HtmlContent);
    }

    [Theory]
    [InlineData(HttpStatusCode.Forbidden, "text/html")]
    [InlineData(HttpStatusCode.OK, "application/pdf")]
    public async Task HttpGrabber_RejectsErrorsAndNonHtml(HttpStatusCode status, string mediaType)
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(status)
        {
            Content = new StringContent("<html></html>", Encoding.UTF8, mediaType)
        });

        var result = await new HtmlGrabberHttpClientService(FactoryFor(handler))
            .GetHtmlContent("https://example.com/", PreviewLanguage.Default);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public async Task ImageSize_ReadsJpegDimensionsBehindLargeExifBlock()
    {
        // SOI, a 20 KB APP1 (EXIF) segment, then SOF2 (progressive) with 1200x800.
        var jpeg = new List<byte> { 0xFF, 0xD8, 0xFF, 0xE1 };
        const int exifLength = 20 * 1024;
        jpeg.AddRange([(byte)(exifLength >> 8), (byte)(exifLength & 0xFF)]);
        jpeg.AddRange(new byte[exifLength - 2]);
        jpeg.AddRange([0xFF, 0xC2, 0x00, 0x11, 0x08, 0x03, 0x20, 0x04, 0xB0]);
        jpeg.AddRange(new byte[64]);
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.OK) { Content = new ByteArrayContent(jpeg.ToArray()) });

        var result = await new ImageSizeService(FactoryFor(handler)).GetImageSizeAsync("https://cdn.test/photo.jpg");

        Assert.True(result.IsSuccess, result.ErrorMessasge);
        Assert.Equal(1200, result.Payload!.Width);
        Assert.Equal(800, result.Payload.Height);
    }

    [Theory]
    [InlineData(null, PreviewLanguage.Default)]
    [InlineData("de-DE,de;q=0.9,en;q=0.8", "de-DE,de;q=0.9,en;q=0.8")]
    [InlineData("de\r\nX-Injected: 1", PreviewLanguage.Default)]
    public void PreviewLanguage_OnlyForwardsWellFormedHeaders(string? header, string expected)
    {
        Assert.Equal(expected, PreviewLanguage.Normalize(header));
    }
}
