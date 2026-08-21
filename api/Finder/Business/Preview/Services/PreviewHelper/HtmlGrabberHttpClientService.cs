using Finder.Business.Shared;
using Microsoft.Playwright;

namespace Finder.Business.Preview.Services.PreviewHelper;
    
public class HtmlGrabberHttpClientService
{
    private readonly IHttpClientFactory _clientFactory;

    public HtmlGrabberHttpClientService(IHttpClientFactory clientFactory)
    {
        _clientFactory = clientFactory;
    }
    
    public async Task<Result<string>> GetHtmlContent(string url)
    {
        try
        {
            var client = _clientFactory.CreateClient("PreviewClient");
            // Fetch HTML content from the target site
            var html = await client.GetStringAsync(url);
            return Result<string>.Success(html);
        }
        catch(Exception)
        {
            return Result<string>.Fail();
        }
    }
}