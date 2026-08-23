using Finder.Business.Shared;
using HtmlAgilityPack;

namespace Finder.Business.Preview.Services.PreviewHelper;
    
public class PreviewGrabberClaudeService
{
    public Result<Models.AIPreview> GetPreview(string htmlContent, Uri baseUrl)
    {
        return Result<Models.AIPreview>.Fail(500, "Not implemented");
    } 
}