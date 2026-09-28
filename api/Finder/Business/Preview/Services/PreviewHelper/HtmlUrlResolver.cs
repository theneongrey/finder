using HtmlAgilityPack;

namespace Finder.Business.Preview.Services.PreviewHelper;

public static class HtmlUrlResolver
{
    /// <summary>The URL relative references on the page resolve against: <c>&lt;base href&gt;</c> if present, else the page URL.</summary>
    public static Uri GetBaseUri(HtmlDocument doc, Uri pageUrl)
    {
        var baseHref = doc.DocumentNode.SelectSingleNode("//base[@href]")?.GetAttributeValue("href", string.Empty);
        if (!string.IsNullOrWhiteSpace(baseHref) && Uri.TryCreate(pageUrl, baseHref.Trim(), out var baseUri) &&
            OutboundUrlGuard.IsAllowedScheme(baseUri))
        {
            return baseUri;
        }

        return pageUrl;
    }

    /// <summary>Resolves a (possibly relative or protocol-relative) reference to an absolute http(s) URL, or null.</summary>
    public static string? Resolve(Uri baseUri, string? reference)
    {
        if (string.IsNullOrWhiteSpace(reference))
        {
            return null;
        }

        var trimmed = System.Web.HttpUtility.HtmlDecode(reference.Trim());
        if (trimmed.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return Uri.TryCreate(baseUri, trimmed, out var resolved) && OutboundUrlGuard.IsAllowedScheme(resolved)
            ? resolved.AbsoluteUri
            : null;
    }
}
