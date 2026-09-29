using Finder.Business.Preview.Api.Responses;
using Finder.Business.Preview.Services;
using Microsoft.AspNetCore.Mvc;

namespace Finder.Business.Preview.Api;

public static class PreviewApi
{
    public static void WithUrlPreviewApi(this WebApplication app)
    {
        // Get a link preview (title, description, image, site name) for a URL
        app.MapGet("/api/preview",
                async (PreviewService previewService, [FromQuery(Name = "url")] string url,
                    [FromHeader(Name = "Accept-Language")] string? acceptLanguage) =>
                {
                    var result = await previewService.GetPreviewAsync(url, acceptLanguage);

                    return !result.IsSuccess ? Results.BadRequest(result.ErrorMessasge) : Results.Ok(result.Payload!.ToPreviewResponse());
                })
            .RequireAuthorization()
            .RequireRateLimiting("preview");
    }
}
