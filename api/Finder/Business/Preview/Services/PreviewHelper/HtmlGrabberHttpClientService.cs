using System.Text;
using System.Text.RegularExpressions;
using Finder.Business.Preview.Models;
using Finder.Business.Shared;

namespace Finder.Business.Preview.Services.PreviewHelper;

public interface IHtmlGrabberHttpClientService
{
    Task<Result<FetchedHtml>> GetHtmlContent(string url, string acceptLanguage);
}

public partial class HtmlGrabberHttpClientService : IHtmlGrabberHttpClientService
{
    public const string ClientName = "PreviewClient";

    /// <summary>
    /// Everything a preview needs (head metadata, JSON-LD, the main product image) sits well within the first
    /// megabytes, so larger pages are cut off instead of downloaded in full.
    /// </summary>
    private const int MaxHtmlBytes = 2 * 1024 * 1024;

    private readonly IHttpClientFactory _clientFactory;

    public HtmlGrabberHttpClientService(IHttpClientFactory clientFactory)
    {
        _clientFactory = clientFactory;
    }

    public async Task<Result<FetchedHtml>> GetHtmlContent(string url, string acceptLanguage)
    {
        try
        {
            var client = _clientFactory.CreateClient(ClientName);
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.TryAddWithoutValidation("Accept-Language", acceptLanguage);

            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
            if (!response.IsSuccessStatusCode)
            {
                return Result<FetchedHtml>.Fail((int)response.StatusCode, "Could not fetch html content");
            }

            var mediaType = response.Content.Headers.ContentType?.MediaType;
            if (mediaType is not null && !mediaType.Contains("html", StringComparison.OrdinalIgnoreCase))
            {
                return Result<FetchedHtml>.Fail(415, "not a valid html page");
            }

            var bytes = await ReadCappedAsync(response.Content);
            var html = Decode(bytes, response.Content.Headers.ContentType?.CharSet);
            if (!html.Contains("<html", StringComparison.OrdinalIgnoreCase) &&
                !html.Contains("<head", StringComparison.OrdinalIgnoreCase))
            {
                return Result<FetchedHtml>.Fail(500, "not a valid html page");
            }

            // After redirects the request URI is the final page, which relative URLs must resolve against.
            var finalUrl = response.RequestMessage?.RequestUri?.AbsoluteUri ?? url;
            return Result<FetchedHtml>.Success(new FetchedHtml(html, finalUrl));
        }
        catch (Exception)
        {
            // Unreachable host, SSRF guard refusal, timeout, TLS failure… — the caller falls back to other sources.
            return Result<FetchedHtml>.Fail(500, "Could not fetch html content");
        }
    }

    private static async Task<byte[]> ReadCappedAsync(HttpContent content)
    {
        await using var stream = await content.ReadAsStreamAsync();
        using var buffer = new MemoryStream();
        var chunk = new byte[81920];
        int read;
        while (buffer.Length < MaxHtmlBytes && (read = await stream.ReadAsync(chunk)) > 0)
        {
            buffer.Write(chunk, 0, (int)Math.Min(read, MaxHtmlBytes - buffer.Length));
        }

        return buffer.ToArray();
    }

    /// <summary>Uses the header charset, else a <c>&lt;meta charset&gt;</c> in the first KB, else UTF-8.</summary>
    private static string Decode(byte[] bytes, string? headerCharset)
    {
        var charset = headerCharset;
        if (string.IsNullOrWhiteSpace(charset))
        {
            var head = Encoding.ASCII.GetString(bytes, 0, Math.Min(bytes.Length, 2048));
            charset = MetaCharsetRegex().Match(head) is { Success: true } match ? match.Groups["charset"].Value : null;
        }

        try
        {
            return (string.IsNullOrWhiteSpace(charset) ? Encoding.UTF8 : Encoding.GetEncoding(charset.Trim('"', '\'')))
                .GetString(bytes);
        }
        catch (ArgumentException)
        {
            return Encoding.UTF8.GetString(bytes);
        }
    }

    [GeneratedRegex(@"<meta[^>]+charset\s*=\s*[""']?(?<charset>[\w-]+)", RegexOptions.IgnoreCase)]
    private static partial Regex MetaCharsetRegex();
}
