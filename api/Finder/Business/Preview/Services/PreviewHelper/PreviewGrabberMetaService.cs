using System.Text.RegularExpressions;
using HtmlAgilityPack;

namespace Finder.Business.Preview.Services.PreviewHelper;

/// <summary>
/// Extracts a preview from the page's declared metadata: Open Graph, Twitter cards, plain meta tags, schema.org
/// JSON-LD and microdata, falling back to <c>&lt;title&gt;</c>, <c>&lt;h1&gt;</c> and the first paragraph.
/// Every field is resolved independently, so a missing one never discards the others.
/// </summary>
public partial class PreviewGrabberMetaService
{
    private const int MinParagraphLength = 60;

    public Models.Preview GetPreview(HtmlDocument doc, Uri pageUrl)
    {
        var baseUri = HtmlUrlResolver.GetBaseUri(doc, pageUrl);
        var meta = ReadMetaTags(doc);
        var jsonLd = JsonLdPreviewReader.Read(doc, baseUri);

        var siteName = First(meta, "og:site_name", "application-name", "apple-mobile-web-app-title")
                       ?? UrlPreviewFallback.GetSiteName(pageUrl);

        var title = First(meta, "og:title", "twitter:title")
                    ?? NullIfEmpty(jsonLd?.Title)
                    ?? First(meta, "title")
                    ?? InnerText(doc, "//title")
                    ?? InnerText(doc, "//h1")
                    ?? string.Empty;

        var description = First(meta, "og:description", "twitter:description", "description")
                          ?? NullIfEmpty(jsonLd?.Description)
                          ?? GetFirstParagraph(doc)
                          ?? string.Empty;

        var imageUrl = HtmlUrlResolver.Resolve(baseUri,
                           First(meta, "og:image:secure_url", "og:image", "og:image:url", "twitter:image",
                               "twitter:image:src"))
                       ?? NullIfEmpty(jsonLd?.ImageUrl)
                       ?? HtmlUrlResolver.Resolve(baseUri,
                           doc.DocumentNode.SelectSingleNode("//link[@rel='image_src']")?.GetAttributeValue("href", ""))
                       ?? HtmlUrlResolver.Resolve(baseUri, GetMicrodataImage(doc, meta))
                       ?? string.Empty;

        return new Models.Preview(StripSiteSuffix(title, siteName, pageUrl), description, imageUrl, pageUrl.AbsoluteUri)
        {
            SiteName = siteName
        };
    }

    /// <summary>Collects meta tags keyed by lower-cased property / name / itemprop; the first non-empty value wins.</summary>
    private static Dictionary<string, string> ReadMetaTags(HtmlDocument doc)
    {
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var nodes = doc.DocumentNode.SelectNodes("//meta[@content]");
        if (nodes is null)
        {
            return result;
        }

        foreach (var node in nodes)
        {
            var content = Clean(node.GetAttributeValue("content", string.Empty));
            if (content.Length == 0)
            {
                continue;
            }

            foreach (var attribute in new[] { "property", "name", "itemprop" })
            {
                var key = node.GetAttributeValue(attribute, string.Empty).Trim();
                if (key.Length > 0)
                {
                    result.TryAdd(key, content);
                }
            }
        }

        return result;
    }

    private static string? First(Dictionary<string, string> meta, params string[] keys) =>
        keys.Select(key => meta.GetValueOrDefault(key)).FirstOrDefault(value => !string.IsNullOrEmpty(value));

    private static string? GetMicrodataImage(HtmlDocument doc, Dictionary<string, string> meta)
    {
        if (meta.TryGetValue("image", out var metaImage))
        {
            return metaImage;
        }

        var node = doc.DocumentNode.SelectSingleNode("//*[@itemprop='image']");
        if (node is null)
        {
            return null;
        }

        return NullIfEmpty(node.GetAttributeValue("src", string.Empty)) ?? NullIfEmpty(node.GetAttributeValue("href", string.Empty));
    }

    private static string? InnerText(HtmlDocument doc, string xpath) =>
        NullIfEmpty(Clean(doc.DocumentNode.SelectSingleNode(xpath)?.InnerText));

    private static string? GetFirstParagraph(HtmlDocument doc)
    {
        var paragraphs = doc.DocumentNode.SelectNodes("//main//p | //article//p") ?? doc.DocumentNode.SelectNodes("//p");
        return paragraphs?
            .Where(p => !IsInsideConsentBanner(p))
            .Select(p => Clean(p.InnerText))
            .FirstOrDefault(text => text.Length >= MinParagraphLength);
    }

    private static bool IsInsideConsentBanner(HtmlNode node) =>
        node.AncestorsAndSelf().Any(ancestor =>
            ConsentHintRegex().IsMatch(ancestor.GetAttributeValue("id", "") + " " + ancestor.GetAttributeValue("class", "")));

    /// <summary>"Adlon Kempinski | Booking.com" -> "Adlon Kempinski", but only when the suffix really is the site.</summary>
    private static string StripSiteSuffix(string title, string siteName, Uri pageUrl)
    {
        var separators = TitleSeparatorRegex().Matches(title);
        if (separators.Count == 0)
        {
            return title;
        }

        var last = separators[^1];
        var head = title[..last.Index].Trim();
        var suffix = title[(last.Index + last.Length)..].Trim();
        var hostLabel = UrlPreviewFallback.GetSiteName(pageUrl).Split('.')[0];
        var isSite = suffix.Equals(siteName, StringComparison.OrdinalIgnoreCase) ||
                     (hostLabel.Length >= 3 && suffix.Contains(hostLabel, StringComparison.OrdinalIgnoreCase));

        return isSite && head.Length > 0 ? head : title;
    }

    private static string Clean(string? text) =>
        string.IsNullOrWhiteSpace(text)
            ? string.Empty
            : WhitespaceRegex().Replace(System.Web.HttpUtility.HtmlDecode(text), " ").Trim();

    private static string? NullIfEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value;

    [GeneratedRegex(@"\s+[|\-–—·•]\s+")]
    private static partial Regex TitleSeparatorRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRegex();

    [GeneratedRegex(@"cookie|consent|gdpr|privacy|cmp", RegexOptions.IgnoreCase)]
    private static partial Regex ConsentHintRegex();
}
