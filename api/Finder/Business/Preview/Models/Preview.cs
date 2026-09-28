namespace Finder.Business.Preview.Models;

public record Preview
{
    public string Title { get; init; }
    public string Description { get; init; }
    public string ImageUrl { get; init; }
    public string Url { get; init; }
    public string SiteName { get; init; } = string.Empty;

    public bool HasTitle => !string.IsNullOrWhiteSpace(Title);
    public bool HasImage => !string.IsNullOrWhiteSpace(ImageUrl);
    public bool IsComplete => HasTitle && HasImage && !string.IsNullOrWhiteSpace(Description);

    public Preview(string title, string description, string imageUrl, string url)
    {
        Title = title;
        Description = description;
        ImageUrl = imageUrl;
        Url = url;
    }

    /// <summary>Keeps every field this preview already has and fills the empty ones from <paramref name="other"/>.</summary>
    public Preview FillFrom(Preview? other)
    {
        if (other is null)
        {
            return this;
        }

        return this with
        {
            Title = HasTitle ? Title : other.Title,
            Description = string.IsNullOrWhiteSpace(Description) ? other.Description : Description,
            ImageUrl = HasImage ? ImageUrl : other.ImageUrl,
            SiteName = string.IsNullOrWhiteSpace(SiteName) ? other.SiteName : SiteName
        };
    }
}
