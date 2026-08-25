using Finder.Business.Shared;
using Finder.Database;
using HtmlAgilityPack;

namespace Finder.Business.Preview.Services.PreviewHelper;
    
public class PreviewGrabberQueryService
{
    private readonly AppDbContext _dbContext;

    public PreviewGrabberQueryService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    public Result<Models.Preview> GetPreview(string htmlContent, Uri baseUrl)
    {
        if (baseUrl.Host.Equals("www.amazon.com", StringComparison.OrdinalIgnoreCase) ||
            baseUrl.Host.StartsWith("www.amazon.", StringComparison.OrdinalIgnoreCase) ||
            baseUrl.Host.StartsWith("amzn.", StringComparison.OrdinalIgnoreCase))
        {
            var doc = new HtmlDocument();
            doc.LoadHtml(htmlContent);

            // 1. Extract Title(check OG, then twitter, fallback to standard <title> tag)
            var title = GetMetaContent(doc, "og:title", "twitter:title");
            if(string.IsNullOrWhiteSpace(title))
            {
                var titleNode = doc.DocumentNode.SelectSingleNode("//title");
                title = System.Web.HttpUtility.HtmlDecode(titleNode.InnerText);
            }
                
            // 2. Extract Description
            var description = GetMetaContent(doc, "og:description", "twitter:description", "description");
            var siteName = GetMetaContent(doc, "og:site_name");

            // 3. Extract image from landing image element
            var landingImage = doc.DocumentNode.SelectSingleNode("//img[@id='landingImage']");
            var imageUrl = landingImage?.GetAttributeValue("src", string.Empty) ?? string.Empty;
            if(!string.IsNullOrWhiteSpace(imageUrl) && !imageUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            {
                imageUrl = new Uri(baseUrl, imageUrl).ToString();
            }

            return Result<Models.Preview>.Success(new Models.Preview(title, description, imageUrl, siteName));
        }

        return Result<Models.Preview>.Fail(500, "Not implemented");
    }
    
    public async Task RegisterQuery(string query)
    {
        
    }
    
    private string GetMetaContent(HtmlDocument doc, params string[] propertyOrNames)
    {
        foreach(var key in propertyOrNames)
        {
            var node = doc.DocumentNode.SelectSingleNode($"//meta[@property='{key}'] | //meta[@name='{key}']");

            // node CAN be null
            // ReSharper disable once ConditionIsAlwaysTrueOrFalseAccordingToNullableAPIContract
            if (node != null)
            {
                var content = node.GetAttributeValue("content", string.Empty);
                if (content.Trim().Length > 0)
                {
                    return System.Web.HttpUtility.HtmlDecode(content);
                }
            }
        }
        return string.Empty;
    }
}