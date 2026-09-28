using Finder.Business.Preview.Models;
using Finder.Business.Preview.Services.PreviewHelper;
using Finder.Business.Preview.Setup;
using Finder.Business.Shared;
using HtmlAgilityPack;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Finder.Business.Preview.Services;

public class PreviewService
{
    /// <summary>DI key of the preview's own size-limited <see cref="IMemoryCache"/>.</summary>
    public const string CacheServiceKey = "preview";

    private readonly PreviewGrabberMetaService _previewGrabberMetaService;
    private readonly IHtmlGrabberPlaywrightService _htmlGrabberPlaywrightService;
    private readonly IPreviewImageCandidateService _previewImageCandidateService;
    private readonly IHtmlGrabberHttpClientService _htmlGrabberHttpClientService;
    private readonly IMemoryCache _cache;
    private readonly PreviewOptions _options;
    private readonly ILogger<PreviewService> _logger;

    public PreviewService(IHtmlGrabberHttpClientService htmlGrabberHttpClientService,
        PreviewGrabberMetaService previewGrabberMetaService,
        IHtmlGrabberPlaywrightService htmlGrabberPlaywrightService,
        IPreviewImageCandidateService previewImageCandidateService,
        [FromKeyedServices(CacheServiceKey)] IMemoryCache cache,
        IOptions<PreviewOptions> options,
        ILogger<PreviewService> logger)
    {
        _htmlGrabberHttpClientService = htmlGrabberHttpClientService;
        _previewGrabberMetaService = previewGrabberMetaService;
        _htmlGrabberPlaywrightService = htmlGrabberPlaywrightService;
        _previewImageCandidateService = previewImageCandidateService;
        _cache = cache;
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// Builds the best preview we can get for <paramref name="url"/>. Succeeds with whatever could be found —
    /// down to a title derived from the URL itself — and only fails for URLs we must not fetch.
    /// </summary>
    public async Task<Result<Models.Preview>> GetPreviewAsync(string url, string? acceptLanguage = null)
    {
        if (string.IsNullOrWhiteSpace(url) || !Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return Result<Models.Preview>.Fail(400, "Invalid URL");
        }

        // Only public http(s) targets. The fetchers re-check every connection (redirects, DNS rebinding).
        if (!await OutboundUrlGuard.IsSafeAsync(uri))
        {
            return Result<Models.Preview>.Fail(400, "Invalid URL");
        }

        var language = PreviewLanguage.Normalize(acceptLanguage);
        var cacheKey = $"preview:{PreviewLanguage.PrimaryLocale(language)}:{uri.AbsoluteUri}";
        if (_cache.TryGetValue(cacheKey, out Models.Preview? cached) && cached is not null)
        {
            return Result<Models.Preview>.Success(cached);
        }

        var outcome = await FetchPreviewAsync(uri, language);
        if (outcome.Refused)
        {
            return Result<Models.Preview>.Fail(400, "Invalid URL");
        }

        if (outcome.Preview is null)
        {
            // Nothing could be fetched (bot protection, timeouts): answer from the URL alone, and don't cache
            // that — the site may well be reachable next time.
            return Result<Models.Preview>.Success(UrlPreviewFallback.FromUrl(uri));
        }

        // Whatever is still missing comes from the URL itself.
        var preview = outcome.Preview.FillFrom(UrlPreviewFallback.FromUrl(new Uri(outcome.Preview.Url)));

        // Incomplete previews may be a bot-challenge page, so they are only kept briefly. 0 disables caching.
        var ttl = preview.IsComplete ? _options.CacheMinutes : Math.Min(_options.CacheMinutes, _options.PartialCacheMinutes);
        if (ttl > 0)
        {
            _cache.Set(cacheKey, preview, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(ttl),
                Size = 1
            });
        }

        return Result<Models.Preview>.Success(preview);
    }

    /// <param name="Preview">What the page itself provided, or null when it could not be fetched at all.</param>
    /// <param name="Refused">The target turned out to be one we must not fetch.</param>
    private record FetchOutcome(Models.Preview? Preview, bool Refused = false);

    private async Task<FetchOutcome> FetchPreviewAsync(Uri uri, string language)
    {
        var url = uri.AbsoluteUri;

        // 1. The plain HTTP client is fast and sufficient for any page that renders its metadata server-side.
        var httpResult = await _htmlGrabberHttpClientService.GetHtmlContent(url, language);
        Models.Preview? httpPreview = null;
        if (httpResult is { IsSuccess: true, Payload: { } httpPage })
        {
            httpPreview = await ExtractAsync(httpPage);
            if (httpPreview.HasTitle && httpPreview.HasImage)
            {
                return new FetchOutcome(httpPreview);
            }
        }

        // 2. Something is missing, the request was blocked, or it's an SPA: render the page in a real browser.
        //    The browser also follows JavaScript / meta-refresh redirects (e.g. shortened links).
        var playwrightResult = await GetBrowserHtmlAsync(url, language);
        if (playwrightResult is { IsSuccess: true, Payload: { } browserPage })
        {
            var browserPreview = await ExtractAsync(browserPage, httpPreview?.HasImage == true);

            // The rendered page is more complete when it is larger (client-rendered content, or HTTP only got
            // a redirect interstitial); prefer its values and fill gaps from the other.
            var httpLength = httpResult.Payload?.HtmlContent.Length ?? 0;
            return new FetchOutcome(httpPreview is null || browserPage.HtmlContent.Length > httpLength
                ? browserPreview.FillFrom(httpPreview)
                : httpPreview.FillFrom(browserPreview));
        }

        _logger.LogInformation("Browser preview for {Url} failed: {Code} {Message}",
            url, playwrightResult.Code, playwrightResult.ErrorMessasge);

        // 3. Parked: site-specific stored queries and AI-suggested images (see PreviewGrabberQueryService and
        //    PreviewGrabberClaudeService) — disabled while the heuristics above cover the common cases.

        // The browser proxy refused the target (e.g. a redirect into our network) and HTTP got nothing either.
        return new FetchOutcome(httpPreview, Refused: httpPreview is null && playwrightResult.Code == 400);
    }

    private async Task<Result<FetchedHtml>> GetBrowserHtmlAsync(string url, string language)
    {
        try
        {
            return await _htmlGrabberPlaywrightService.GetHtmlContent(url, language);
        }
        catch (Exception ex)
        {
            // e.g. the browser could not be launched — still answer with what HTTP and the URL provide.
            _logger.LogWarning(ex, "Browser preview for {Url} threw", url);
            return Result<FetchedHtml>.Fail(503, "Browser unavailable");
        }
    }

    private async Task<Models.Preview> ExtractAsync(FetchedHtml page, bool skipImageSearch = false)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(page.HtmlContent);
        var pageUrl = new Uri(page.Url);

        var preview = _previewGrabberMetaService.GetPreview(doc, pageUrl);
        if (preview.HasImage || skipImageSearch)
        {
            return preview;
        }

        var image = await _previewImageCandidateService.FindImageAsync(doc, preview.Title, pageUrl);
        return image is null ? preview : preview with { ImageUrl = image };
    }
}
