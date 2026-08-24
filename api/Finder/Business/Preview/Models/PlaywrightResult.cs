namespace Finder.Business.Preview.Models;

public record PlaywrightResult
{
    public string HtmlContent { get; init; }
    public string Url { get; init; }

    public PlaywrightResult(string htmlContent, string url)
    {
        HtmlContent = htmlContent;
        Url = url;
    }
}