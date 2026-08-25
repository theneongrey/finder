namespace Finder.Business.Preview.Models;

public record Preview
{
    public string Title { get; init; }
    public string Description { get; init; }
    public string ImageUrl { get; init; }
    public string Url { get; init; }
    public bool HasImage => !string.IsNullOrEmpty(ImageUrl);

    public Preview(string title, string description, string imageUrl, string url)
    {
        Title = title;
        Description = description;
        ImageUrl = imageUrl;
        Url = url;
    }
}