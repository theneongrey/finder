namespace Finder.Business.Preview.Api.Responses;

public class PreviewResponse
{
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required string ImageUrl { get; init; }
}

public static class PreviewMapper
{
    public static PreviewResponse ToPreviewResponse(this Models.Preview preview)
    {
        return new PreviewResponse
        {
            Title = preview.Title,
            Description = preview.Description,
            ImageUrl = preview.ImageUrl
        };
    }
}