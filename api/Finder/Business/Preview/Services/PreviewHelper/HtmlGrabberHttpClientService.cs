using Finder.Business.Shared;

namespace Finder.Business.Preview.Services.PreviewHelper;

public interface IHtmlGrabberHttpClientService
{
    Task<Result<string>> GetHtmlContent(string url);
}

public class HtmlGrabberHttpClientService : IHtmlGrabberHttpClientService
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

            if (html.Contains("html"))
            {
                return Result<string>.Success(html);
            }

            return Result<string>.Fail(500, "not a valid html page");
        }
        catch (Exception)
        {
            return Result<string>.Fail(500, "Could not fetch html content");
        }
    }
}