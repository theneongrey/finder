using System.Text.RegularExpressions;
using Anthropic;
using Anthropic.Models.Messages;
using Finder.Business.Shared;
using HtmlAgilityPack;

namespace Finder.Business.Preview.Services.PreviewHelper;

public class PreviewGrabberClaudeService
{
    private readonly IConfiguration _configuration;

    public PreviewGrabberClaudeService(IConfiguration configuration)
    {
        // this service is not used for now.
        // HTML page exceeds the token-limit. And fetching takes too much time.
        // Instead, I could filter out only the images and then let Claude decide. But: I can do this myself without spending tokens
        
        _configuration = configuration;
    }

    public async Task<Result<Models.AIPreview>> GetPreview(string htmlContent, Models.Preview collectedData)
    {
        var client = new AnthropicClient
        {
            ApiKey = _configuration.GetValue<string>("Preview:ClaudeApiKey") ??
                     throw new InvalidOperationException("Preview:ClaudeApiKey is not set."),
        };

        var dataToCollect = GetDataToCollect(collectedData);
        var compressedHtml = CompressHtml(htmlContent);
        
        var messages =
            new List<MessageParam>
            {
                new(){
                    Role = Role.User,
                    Content = $@"Extract the {dataToCollect.names} for a preview image from the following HTML content. Dont return the raw values, return the xpath to get to this elements. Return the result in JSON format with keys {dataToCollect.keys}.\n\nHTML Content is: {compressedHtml}."
                }
            };

        Message message;
        if (await IsTokenLimitExceeded(client, messages))
        {
            message = await FetchPage(client, dataToCollect, collectedData.Url);
        }
        else
        {
            message = await ParseMessage(client, messages);
        }

        foreach (var block in message.Content)
        {
            if (block.TryPickText(out var textBlock))
            {
            }
        }

        return Result<Models.AIPreview>.Fail(500, "Not implemented");
    }

    private static string CompressHtml(string htmlContent)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(htmlContent);

        // reduce the token size by removing scripts, links, and styles (we risk here, that the image could be a background image)
        doc.DocumentNode.SelectNodes("//script|//link|//style|//input|//header|//nav|//footer|//i|//button|//select")
            .ToList().ForEach(n => n.Remove());

        var strippedHtml = Regex.Replace(doc.DocumentNode.OuterHtml, @"\s+", " ").Trim();
        return strippedHtml;
    }

    private async Task<bool> IsTokenLimitExceeded(AnthropicClient client, List<MessageParam> messages)
    {
        var countParameters = new MessageCountTokensParams
        {
            Model = Model.ClaudeHaiku4_5,
            Messages = messages
        };

        var tokenCount = await client.Messages.CountTokens(countParameters);
        return tokenCount.InputTokens > 200000;
    }

    private async Task<Message> FetchPage(AnthropicClient client, (string names, string keys) dataToCollect, string url)
    {
        var messages =
            new List<MessageParam>
            {
                new(){
                    Role = Role.User,
                    Content = $@"Extract the {dataToCollect.names} for a preview image from the following url. Dont return the raw values, return the xpath to get to this elements. Return the result in JSON format with keys {dataToCollect.keys}.\nThe url is {url}.",
                }
            };
        
        var parameters = new MessageCreateParams
        {
            MaxTokens = 1024,
            Model = Model.ClaudeSonnet4_6,
            Messages = messages,
            Tools = [new WebFetchTool20260318()]
        };

        return await client.Messages.Create(parameters);
    }

    private async Task<Message> ParseMessage(AnthropicClient client, List<MessageParam> messages)
    {
        var parameters = new MessageCreateParams
        {
            MaxTokens = 1024,
            Model = Model.ClaudeHaiku4_5,
            Messages = messages
        };

        return await client.Messages.Create(parameters); 
    }

    private (string names, string keys) GetDataToCollect(Models.Preview collectedData)
    {
        var missingDataNames = new List<string>();
        var missingDataKeys = new List<string>();

        if (string.IsNullOrWhiteSpace(collectedData.ImageUrl))
        {
            missingDataNames.Add("imageURL");
            missingDataKeys.Add("'image'");
        }

        if (string.IsNullOrWhiteSpace(collectedData.Description))
        {
            missingDataNames.Add("description");
            missingDataKeys.Add("'description'");
        }
        
        if (string.IsNullOrWhiteSpace(collectedData.Title))
        {
            missingDataNames.Add("title");
            missingDataKeys.Add("'title'");
        }

        return (string.Join(", ", missingDataNames), string.Join(", ", missingDataKeys));
    }
}