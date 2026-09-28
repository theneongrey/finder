namespace Finder.Business.Preview.Models;

/// <summary>HTML of a fetched page together with the final URL after all redirects.</summary>
public record FetchedHtml(string HtmlContent, string Url);
