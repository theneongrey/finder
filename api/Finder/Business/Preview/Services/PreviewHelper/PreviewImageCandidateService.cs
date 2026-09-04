using Finder.Business.Preview.Models;
using Finder.Business.Shared;

namespace Finder.Business.Preview.Services.PreviewHelper;

public interface IPreviewImageCandidateService
{
    Task<Result<Models.Preview>> GetPreviewWithValidatedImageAsync(string htmlContent, Models.Preview? basePreview, string baseUrl);
}

public class PreviewImageCandidateService : IPreviewImageCandidateService
{
    private readonly PreviewImageOnlyFinder _imageFinder;
    private readonly IImageSizeService _imageSizeService;

    public PreviewImageCandidateService(PreviewImageOnlyFinder imageFinder, IImageSizeService imageSizeService)
    {
        _imageFinder = imageFinder;
        _imageSizeService = imageSizeService;
    }

    public async Task<Result<Models.Preview>> GetPreviewWithValidatedImageAsync(string htmlContent, Models.Preview? basePreview, string baseUrl)
    {
        var imageCandidate = _imageFinder.GetMostPromisingImage(htmlContent, basePreview?.Title);

        if (string.IsNullOrWhiteSpace(imageCandidate))
        {
            return Result<Models.Preview>.Fail(404, "No image candidate found");
        }

        if (!imageCandidate.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            imageCandidate = new Uri(new Uri(baseUrl), imageCandidate).ToString();
        }

        var sizeResult = await _imageSizeService.GetImageSizeAsync(imageCandidate);
        if (!sizeResult.IsSuccess || !IsValidSize(sizeResult.Payload!))
        {
            return Result<Models.Preview>.Fail(422, "Image does not meet size criteria");
        }

        var preview = basePreview is not null
            ? basePreview with { ImageUrl = imageCandidate }
            : new Models.Preview("", "", imageCandidate, baseUrl);

        return Result<Models.Preview>.Success(preview);
    }

    private static bool IsValidSize(ImageSize size) =>
        size.Width >= 100 &&
        size.Height >= 100 &&
        size.Width <= size.Height * 2.0 &&
        size.Height <= size.Width * 1.5;
}
