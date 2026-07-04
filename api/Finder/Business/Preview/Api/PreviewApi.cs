using System.Web;
using Finder.Business.Preview.Api.Responses;
using Finder.Business.Preview.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Finder.Business.Preview.Api;

public static class PreviewApi
{
    public static void WithUrlPreviewApi(this WebApplication app)
    {
        // Get all projects
        app.MapGet("/api/preview",
                async (PreviewService previewService, [FromQuery(Name = "url")] string url) =>
                {
                    var myWriter = new StringWriter();
                    HttpUtility.HtmlDecode(url, myWriter);
                    
                    var result = await previewService.GetPreviewAsync(url);
                    
                    return !result.IsSuccess ? Results.BadRequest(result.ErrorMessasge) : Results.Ok(result.Payload!.ToPreviewResponse());
                })
            .RequireAuthorization()
            .RequireRateLimiting("preview");
    }
}
