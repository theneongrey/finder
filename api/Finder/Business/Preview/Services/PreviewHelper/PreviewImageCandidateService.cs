using Finder.Business.Preview.Models;
using HtmlAgilityPack;

namespace Finder.Business.Preview.Services.PreviewHelper;

public interface IPreviewImageCandidateService
{
    /// <summary>The best image in the page's markup that is big enough and roughly card-shaped, or null.</summary>
    Task<string?> FindImageAsync(HtmlDocument doc, string? title, Uri pageUrl);
}

public class PreviewImageCandidateService : IPreviewImageCandidateService
{
    private const int MaxCandidatesToCheck = 5;

    private readonly PreviewImageOnlyFinder _imageFinder;
    private readonly IImageSizeService _imageSizeService;

    public PreviewImageCandidateService(PreviewImageOnlyFinder imageFinder, IImageSizeService imageSizeService)
    {
        _imageFinder = imageFinder;
        _imageSizeService = imageSizeService;
    }

    public async Task<string?> FindImageAsync(HtmlDocument doc, string? title, Uri pageUrl)
    {
        var ranked = _imageFinder.GetRankedImages(doc, title, HtmlUrlResolver.GetBaseUri(doc, pageUrl));
        if (ranked.IsSiteSpecific)
        {
            return ranked.Urls.FirstOrDefault();
        }

        var candidates = ranked.Urls.Take(MaxCandidatesToCheck).ToList();

        // Probe the top candidates in parallel, then keep the ranking order among the valid ones.
        var sizes = await Task.WhenAll(candidates.Select(_imageSizeService.GetImageSizeAsync));

        return candidates
            .Where((_, index) => sizes[index].IsSuccess && sizes[index].Payload is { } size && IsValidSize(size))
            .FirstOrDefault();
    }

    private static bool IsValidSize(ImageSize size) =>
        size.Width >= 100 &&
        size.Height >= 100 &&
        size.Width <= size.Height * 2.0 &&
        size.Height <= size.Width * 1.5;
}
