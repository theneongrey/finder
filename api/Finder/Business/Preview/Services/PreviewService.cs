using Finder.Business.Shared;
using HtmlAgilityPack;

namespace Finder.Business.Preview.Services;

public record Preview
{
    public string Title { get; init; }
    public string Description { get; init; }
    public string ImageUrl { get; init; }
    public string SiteName { get; init; }

    public Preview(string title, string description, string imageUrl, string siteName)
    {
        Title = title;
        Description = description;
        ImageUrl = imageUrl;
        SiteName = siteName;
    }
}
    
public class PreviewService
{
    private readonly IHttpClientFactory _clientFactory;

    public PreviewService(IHttpClientFactory clientFactory)
    {
        _clientFactory = clientFactory;
    }
    public async Task<Result<Preview>> GetPreviewAsync(string url)
    {
        if(string.IsNullOrWhiteSpace(url) || !Uri.IsWellFormedUriString(url, UriKind.Absolute))
        {
            return Result<Preview>.Fail(400, "Invalid URL");
        }

        try
        {
            var client = _clientFactory.CreateClient("PreviewClient");
            // Fetch HTML content from the target site
            var html = await client.GetStringAsync(url);

            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            // 1. Extract Title(check OG, then twitter, fallback to standard <title> tag)
            var title = GetMetaContent(doc, "og:title", "twitter:title");
            if(string.IsNullOrWhiteSpace(title))
            {
                var titleNode = doc.DocumentNode.SelectSingleNode("//title");
                title = System.Web.HttpUtility.HtmlDecode(titleNode.InnerText);
            }
                
            // 2. Extract Description
            var description = GetMetaContent(doc, "og:description", "twitter:description", "description");

            // 3. Extract Image
            var imageUrl = GetMetaContent(doc, "og:image", "twitter:image");

            // Resolve relative image URLs if necessary
            if(!string.IsNullOrWhiteSpace(imageUrl) && !imageUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            {
                var baseUrl = new Uri(url);
                imageUrl = new Uri(baseUrl, imageUrl).ToString();
            }

            // 4. Extract Site name
            var siteName = GetMetaContent(doc, "og:site_name");

            return Result<Preview>.Success(new Preview(title, description, imageUrl, siteName));
        }
        catch(Exception)
        {
            return Result<Preview>.Fail(500, "Failed to fetch preview");
        }
    }
        
    private string GetMetaContent(HtmlDocument doc, params string[] propertyOrNames)
    {
        foreach(var key in propertyOrNames)
        {
            var node = doc.DocumentNode.SelectSingleNode($"//meta[@property='{key}'] | //meta[@name='{key}']");
                
            var content = node.GetAttributeValue("content", string.Empty);
            if(content.Trim().Length > 0)
            {
                return System.Web.HttpUtility.HtmlDecode(content);
            }
        }
        return string.Empty;
    }
}