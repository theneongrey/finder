using Finder.Business.Preview.Services.PreviewHelper;
using Finder.Business.Shared;
using HtmlAgilityPack;

namespace Finder.Business.Preview.Services;

public class PreviewService
{
    private readonly PreviewGrabberMetaService _previewGrabberMetaService;
    private readonly HtmlGrabberPlaywrightService _htmlGrabberPlaywrightService;
    private readonly PreviewGrabberQueryService _previewGrabberQueryService;
    private readonly PreviewGrabberClaudeService _previewGrabberClaudeService;
    private readonly HtmlGrabberHttpClientService _htmlGrabberHttpClientService;

    public PreviewService(HtmlGrabberHttpClientService htmlGrabberHttpClientService,
        PreviewGrabberMetaService previewGrabberMetaService,
        HtmlGrabberPlaywrightService htmlGrabberPlaywrightService,
        PreviewGrabberQueryService previewGrabberQueryService,
        PreviewGrabberClaudeService previewGrabberClaudeService)
    {
        _htmlGrabberHttpClientService = htmlGrabberHttpClientService;
        _previewGrabberMetaService = previewGrabberMetaService;
        _htmlGrabberPlaywrightService = htmlGrabberPlaywrightService;
        _previewGrabberQueryService = previewGrabberQueryService;
        _previewGrabberClaudeService = previewGrabberClaudeService;
    }

    public async Task<Result<Models.Preview>> GetPreviewAsync(string url)
    {
        if (string.IsNullOrWhiteSpace(url) || !Uri.IsWellFormedUriString(url, UriKind.Absolute))
        {
            return Result<Models.Preview>.Fail(400, "Invalid URL");
        }

        // 1. Try the plain HTTP client first and try to find out if you can get the image via the meta tags
        var httpHtmlResult = await _htmlGrabberHttpClientService.GetHtmlContent(url);
        if (!httpHtmlResult.IsSuccess)
        {
            Result<Models.Preview>.Fail(500, "Failed to fetch from url");
        }

        var httpClientHtmlContent = httpHtmlResult.Payload!;

        var metaResult = _previewGrabberMetaService.GetPreview(httpClientHtmlContent, new Uri(url));
        if (metaResult.IsSuccess && metaResult.Payload!.HasImage)
        {
            return metaResult;
        }

        // 2. If the plain HTTP client does not work, maybe it's an SPA, try it with playwright
        var htmlPlaywrightResult = await _htmlGrabberPlaywrightService.GetHtmlContent(url);
        if (!htmlPlaywrightResult.IsSuccess)
        {
            Result<Models.Preview>.Fail(500, "Failed to fetch from url");
        }

        var playwrightHtmlContent = htmlPlaywrightResult.Payload!;
        if (httpClientHtmlContent.Length != playwrightHtmlContent.Length)
        {
            // Even if the content changed after calling it with playwright, it's most likely the metadata will
            // not change, but since it's a low-cost operation, try it again.

            var metaPlaywrightResult = _previewGrabberMetaService.GetPreview(httpHtmlResult.Payload!, new Uri(url));
            if (metaPlaywrightResult.IsSuccess && metaPlaywrightResult.Payload!.HasImage)
            {
                return metaPlaywrightResult;
            }
        }

        // 3. Let's see first if we have any query to grab the info from the HTML content 
        var queryResult = _previewGrabberQueryService.GetPreview(playwrightHtmlContent, new Uri(url));
        if (queryResult.IsSuccess && queryResult.Payload!.HasImage)
        {
            return queryResult;
        }

        // 4. If we don't have any preview picture so far, let's ask the AI for a suggestion 
        var claudeResult = _previewGrabberClaudeService.GetPreview(playwrightHtmlContent, new Uri(url));
        if (claudeResult.IsSuccess && claudeResult.Payload!.HasImage)
        {
            
        }
        

        return metaResult;
    }
}