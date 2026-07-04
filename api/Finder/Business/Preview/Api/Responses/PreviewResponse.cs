namespace Finder.Business.Preview.Api.Responses;

public class PreviewResponse
{
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required string ImageUrl { get; init; }
    public required string SiteName { get; init; }
}

public static class PreviewMapper
{
    public static PreviewResponse ToPreviewResponse(this Services.Preview preview)
    {
        return new PreviewResponse
        {
            Title = preview.Title,
            Description = preview.Description,
            ImageUrl = preview.ImageUrl,
            SiteName = preview.SiteName
        };
    }
}