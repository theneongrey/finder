using System.Text.Json;
using HtmlAgilityPack;

namespace Finder.Business.Preview.Services.PreviewHelper;

/// <summary>
/// Reads title, description and image from schema.org JSON-LD blocks
/// (<c>&lt;script type="application/ld+json"&gt;</c>). Shops, hotels, events and articles embed these for search
/// engines, and they are often more precise than — or present where — Open Graph tags are missing.
/// </summary>
public static class JsonLdPreviewReader
{
    public record JsonLdPreview(string Title, string Description, string ImageUrl);

    // The more specific the entity, the better it describes the page. Everything else (WebSite, Organization,
    // BreadcrumbList, …) describes the site, not the page, and is ignored.
    private static readonly string[] PreferredTypes =
    [
        "Product", "ProductGroup", "Hotel", "LodgingBusiness", "Apartment", "VacationRental", "House", "Accommodation",
        "Event", "Recipe", "Book", "Movie", "Course", "SoftwareApplication", "Restaurant", "TouristAttraction",
        "LocalBusiness", "Place", "Article", "NewsArticle", "BlogPosting", "VideoObject", "WebPage"
    ];

    private static readonly JsonDocumentOptions JsonOptions = new()
    {
        AllowTrailingCommas = true,
        CommentHandling = JsonCommentHandling.Skip
    };

    public static JsonLdPreview? Read(HtmlDocument doc, Uri baseUri)
    {
        var scripts = doc.DocumentNode.SelectNodes("//script[@type='application/ld+json']");
        if (scripts is null)
        {
            return null;
        }

        var nodes = new List<JsonElement>();
        foreach (var script in scripts)
        {
            var root = Parse(script.InnerText);
            if (root is not null)
            {
                CollectNodes(root.Value, nodes);
            }
        }

        var best = nodes
            .Select(node => (Node: node, Rank: GetRank(node)))
            .Where(candidate => candidate.Rank >= 0)
            .OrderBy(candidate => candidate.Rank)
            .Select(candidate => candidate.Node)
            .FirstOrDefault();

        if (best.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        var title = GetString(best, "name") ?? GetString(best, "headline") ?? string.Empty;
        var description = GetString(best, "description") ?? string.Empty;
        var image = HtmlUrlResolver.Resolve(baseUri, GetImage(best)) ?? string.Empty;

        return new JsonLdPreview(
            System.Web.HttpUtility.HtmlDecode(title).Trim(),
            System.Web.HttpUtility.HtmlDecode(description).Trim(),
            image);
    }

    private static JsonElement? Parse(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        // Some sites HTML-encode the script body; try the raw text first, then the decoded one.
        foreach (var candidate in new[] { json, System.Web.HttpUtility.HtmlDecode(json) })
        {
            try
            {
                using var document = JsonDocument.Parse(candidate.Trim(), JsonOptions);
                return document.RootElement.Clone();
            }
            catch (JsonException)
            {
            }
        }

        return null;
    }

    private static void CollectNodes(JsonElement element, List<JsonElement> nodes)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray())
                {
                    CollectNodes(item, nodes);
                }

                break;
            case JsonValueKind.Object:
                nodes.Add(element);
                if (element.TryGetProperty("@graph", out var graph))
                {
                    CollectNodes(graph, nodes);
                }

                // A WebPage often wraps the actual entity: { "@type": "WebPage", "mainEntity": { "@type": "Product" } }
                if (element.TryGetProperty("mainEntity", out var mainEntity))
                {
                    CollectNodes(mainEntity, nodes);
                }

                break;
        }
    }

    /// <summary>Lower is better; -1 means the node is not usable.</summary>
    private static int GetRank(JsonElement node)
    {
        if (GetString(node, "name") is null && GetString(node, "headline") is null)
        {
            return -1;
        }

        var types = GetTypes(node);
        var typeRank = types
            .Select(type => Array.IndexOf(PreferredTypes, type))
            .Where(index => index >= 0)
            .DefaultIfEmpty(-1)
            .Min();

        if (typeRank < 0)
        {
            return -1;
        }

        // Prefer nodes that come with an image, keeping the type order among them.
        return GetImage(node) is null ? typeRank + PreferredTypes.Length : typeRank;
    }

    private static IEnumerable<string> GetTypes(JsonElement node)
    {
        if (!node.TryGetProperty("@type", out var type))
        {
            return [];
        }

        return type.ValueKind switch
        {
            JsonValueKind.String => [type.GetString() ?? string.Empty],
            JsonValueKind.Array => type.EnumerateArray()
                .Where(t => t.ValueKind == JsonValueKind.String)
                .Select(t => t.GetString() ?? string.Empty),
            _ => []
        };
    }

    private static string? GetString(JsonElement node, string property)
    {
        if (!node.TryGetProperty(property, out var value))
        {
            return null;
        }

        var text = value.ValueKind switch
        {
            JsonValueKind.String => value.GetString(),
            // e.g. "name": { "@value": "…", "@language": "de" }
            JsonValueKind.Object when value.TryGetProperty("@value", out var inner) &&
                                      inner.ValueKind == JsonValueKind.String => inner.GetString(),
            JsonValueKind.Array => value.EnumerateArray()
                .Where(item => item.ValueKind == JsonValueKind.String)
                .Select(item => item.GetString())
                .FirstOrDefault(),
            _ => null
        };

        return string.IsNullOrWhiteSpace(text) ? null : text;
    }

    /// <summary>schema.org <c>image</c> can be a URL, an ImageObject, or an array of either.</summary>
    private static string? GetImage(JsonElement node)
    {
        if (!node.TryGetProperty("image", out var image))
        {
            return null;
        }

        return GetImageUrl(image);
    }

    private static string? GetImageUrl(JsonElement image)
    {
        return image.ValueKind switch
        {
            JsonValueKind.String => string.IsNullOrWhiteSpace(image.GetString()) ? null : image.GetString(),
            JsonValueKind.Object => GetString(image, "url") ?? GetString(image, "contentUrl"),
            JsonValueKind.Array => image.EnumerateArray().Select(GetImageUrl).FirstOrDefault(url => url is not null),
            _ => null
        };
    }
}
