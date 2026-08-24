using Finder.Business.Shared;
using HtmlAgilityPack;

namespace Finder.Business.Preview.Services.PreviewHelper;
    
public class PreviewGrabberMetaService
{
    public Result<Models.Preview> GetPreview(string htmlContent, Uri baseUrl)
    {
        try
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

            // 3. Extract Image
            var imageUrl = GetMetaContent(doc, "og:image", "twitter:image");

            // Resolve relative image URLs if necessary
            if(!string.IsNullOrWhiteSpace(imageUrl) && !imageUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            {
                imageUrl = new Uri(baseUrl, imageUrl).ToString();
            }

            return Result<Models.Preview>.Success(new Models.Preview(title, description, imageUrl, baseUrl.AbsoluteUri));
        }
        catch(Exception)
        {
            return Result<Models.Preview>.Fail(500, "Failed to read from url content");
        }
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