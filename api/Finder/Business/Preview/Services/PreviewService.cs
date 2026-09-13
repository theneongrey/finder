using Finder.Business.Preview.Services.PreviewHelper;
using Finder.Business.Shared;

namespace Finder.Business.Preview.Services;

public class PreviewService
{
    private readonly PreviewGrabberMetaService _previewGrabberMetaService;
    private readonly IHtmlGrabberPlaywrightService _htmlGrabberPlaywrightService;
    private readonly IPreviewImageCandidateService _previewImageCandidateService;
    private readonly IHtmlGrabberHttpClientService _htmlGrabberHttpClientService;

    public PreviewService(IHtmlGrabberHttpClientService htmlGrabberHttpClientService,
        PreviewGrabberMetaService previewGrabberMetaService,
        IHtmlGrabberPlaywrightService htmlGrabberPlaywrightService,
        IPreviewImageCandidateService previewImageCandidateService)
    {
        _htmlGrabberHttpClientService = htmlGrabberHttpClientService;
        _previewGrabberMetaService = previewGrabberMetaService;
        _htmlGrabberPlaywrightService = htmlGrabberPlaywrightService;
        _previewImageCandidateService = previewImageCandidateService;
    }

    public async Task<Result<Models.Preview>> GetPreviewAsync(string url)
    {
        if (string.IsNullOrWhiteSpace(url) || !Uri.TryCreate(url, UriKind.Absolute, out _))
        {
            return Result<Models.Preview>.Fail(400, "Invalid URL");
        }

        // 1. Try the plain HTTP client first and try to find out if you can get the image via the meta tags
        var httpHtmlResult = await _htmlGrabberHttpClientService.GetHtmlContent(url);
        var htmlContent = httpHtmlResult.Payload!;
        Models.Preview? preview = null;
        
        if (httpHtmlResult.IsSuccess)
        {
            var metaResult = _previewGrabberMetaService.GetPreview(htmlContent, new Uri(url));
            if (metaResult.IsSuccess)
            {
                preview = metaResult.Payload;
                if (metaResult.Payload!.HasImage)
                {
                    return metaResult;
                }    
            }
            
        }

        // 2. If the plain HTTP client does not work, maybe it's an SPA, try it with playwright
        try
        {
            var htmlPlaywrightResult = await _htmlGrabberPlaywrightService.GetHtmlContent(url);
            if (htmlPlaywrightResult.IsSuccess)
            {
                htmlContent = htmlPlaywrightResult.Payload!.HtmlContent;
                url = htmlPlaywrightResult.Payload!.Url;

                if (!httpHtmlResult.IsSuccess || htmlContent.Length != htmlContent.Length)
                {
                    // Even if the content changed after calling it with playwright, it's most likely the metadata will
                    // not change, but since it's a low-cost operation, try it again.

                    var metaPlaywrightResult = _previewGrabberMetaService.GetPreview(htmlContent, new Uri(url));
                    if (metaPlaywrightResult.IsSuccess)
                    {
                        preview = metaPlaywrightResult.Payload;
                        if (metaPlaywrightResult.Payload!.HasImage)
                        {
                            return metaPlaywrightResult;
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            return Result<Models.Preview>.Fail(500, "Failed to fetch from url");
        }

        // 3. Let's see first if we have any query to grab the info from the HTML content 
        /* since we arent saving the xpath by the ai no more, this step can be skipped for now.
        var queryResult = _previewGrabberQueryService.GetPreview(playwrightHtmlContent, new Uri(playwrightResultUrl));
        if (queryResult.IsSuccess && queryResult.Payload!.HasImage)
        {
            return queryResult;
        }
        */

        // 4. If we don't have any preview picture so far, let's ask the AI for a suggestion (disabled for now)
        /*
        var claudeResult = await _previewGrabberClaudeService.GetPreview(playwrightHtmlContent, metaPlaywrightPreview ?? new Models.Preview("", "", "", playwrightResultUrl));
        if (claudeResult.IsSuccess && claudeResult.Payload!.HasImage)
        {
            return Result<Models.Preview>.Success(claudeResult.Payload!);
        }
        */

        var imageResult = await _previewImageCandidateService.GetPreviewWithValidatedImageAsync(htmlContent, preview, url);
        if (imageResult.IsSuccess)
        {
            return imageResult;
        }

        if (preview is not null)
        {
            return Result<Models.Preview>.Success(preview);
        }

        return Result<Models.Preview>.Fail(500, "Failed to fetch from url");
    }
}