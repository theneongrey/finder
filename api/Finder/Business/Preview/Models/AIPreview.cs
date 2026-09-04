namespace Finder.Business.Preview.Models;

public record AIPreview : Preview
{
    public string? ImageQuery { get; init; }
    public string? DescriptionQuery { get; init; }

    public AIPreview(string title, string description, string imageUrl, string siteName, string elementQuery) : base(title, description, imageUrl, siteName)
    {

    }
}