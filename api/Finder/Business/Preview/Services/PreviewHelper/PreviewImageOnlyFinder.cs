using System.Text.Json;
using System.Text.RegularExpressions;
using HtmlAgilityPack;

namespace Finder.Business.Preview.Services.PreviewHelper;

/// <summary>Image URLs, most promising first.</summary>
/// <param name="IsSiteSpecific">
/// Found through markup we know (e.g. Amazon's product gallery): exact, so no size heuristics are needed.
/// </param>
public record RankedImages(IReadOnlyList<string> Urls, bool IsSiteSpecific);

/// <summary>
/// Guesses the preview image of a page that does not declare one, by ranking the images in its markup.
/// Returns absolute URLs, most promising first; the caller validates generic candidates' actual dimensions.
/// </summary>
public partial class PreviewImageOnlyFinder
{
    private class ImageCandidate
    {
        public string Src { get; init; } = "";
        public string Hints { get; init; } = "";
        public int Width { get; init; }
        public int Height { get; init; }
        public int Order { get; init; }
    }

    private static readonly string[] SourceAttributes = ["src", "data-src", "data-lazy-src", "data-original", "data-lazy"];
    private static readonly string[] SrcSetAttributes = ["srcset", "data-srcset", "data-lazy-srcset"];

    public RankedImages GetRankedImages(HtmlDocument doc, string? title, Uri baseUri)
    {
        // Site-specific markup first: it is exact where the generic ranking has to guess.
        var amazon = GetAmazonSpecific(doc);
        if (amazon.Count > 0)
        {
            return new RankedImages(Resolve(amazon.OrderByDescending(c => c.Width * c.Height), baseUri), true);
        }

        var check24 = GetCheck24Specific(doc);
        if (check24.Count > 0)
        {
            return new RankedImages(Resolve(check24, baseUri), true);
        }

        var titleWords = GetSignificantWords(title);
        var ranked = GetGenericCandidates(doc)
            .OrderByDescending(c => GetPriority(c, titleWords))
            .ThenByDescending(c => c.Width * c.Height)
            .ThenBy(c => c.Order);

        return new RankedImages(Resolve(ranked, baseUri), false);
    }

    private static List<ImageCandidate> GetGenericCandidates(HtmlDocument doc)
    {
        var candidates = new List<ImageCandidate>();
        var nodes = doc.DocumentNode.SelectNodes("//img | //picture/source");
        if (nodes is null)
        {
            return candidates;
        }

        foreach (var node in nodes)
        {
            var src = GetLargestFromSrcSet(node) ??
                      SourceAttributes
                          .Select(attribute => node.GetAttributeValue(attribute, string.Empty).Trim())
                          .FirstOrDefault(value => value.Length > 0 && !value.StartsWith("data:", StringComparison.OrdinalIgnoreCase));

            if (string.IsNullOrWhiteSpace(src) || JunkImageRegex().IsMatch(src))
            {
                continue;
            }

            // <source> carries no alt/size; describe it through its <picture>'s <img>.
            var described = node.Name == "source"
                ? node.ParentNode.SelectSingleNode(".//img") ?? node
                : node;

            candidates.Add(new ImageCandidate
            {
                Src = src,
                Hints = string.Join(' ',
                    described.GetAttributeValue("alt", ""),
                    described.GetAttributeValue("id", ""),
                    described.GetAttributeValue("class", ""),
                    src),
                Width = GetDimension(described, "width"),
                Height = GetDimension(described, "height"),
                Order = candidates.Count
            });
        }

        return candidates;
    }

    /// <summary>2 = looks like the page's main image, 1 = neutral, 0 = looks like chrome (logo, avatar, ad).</summary>
    private static int GetPriority(ImageCandidate candidate, IReadOnlyCollection<string> titleWords)
    {
        if (PromisingHintRegex().IsMatch(candidate.Hints))
        {
            return 2;
        }

        var matchingTitleWords = titleWords.Count(word => candidate.Hints.Contains(word, StringComparison.OrdinalIgnoreCase));
        if (matchingTitleWords >= Math.Min(2, titleWords.Count) && matchingTitleWords > 0)
        {
            return 2;
        }

        return UnlikelyHintRegex().IsMatch(candidate.Hints) ? 0 : 1;
    }

    private static List<string> GetSignificantWords(string? title) =>
        string.IsNullOrWhiteSpace(title)
            ? []
            : WordRegex().Matches(title).Select(m => m.Value).Where(word => word.Length >= 4).Distinct().ToList();

    private static string? GetLargestFromSrcSet(HtmlNode node)
    {
        foreach (var attribute in SrcSetAttributes)
        {
            var srcSet = node.GetAttributeValue(attribute, string.Empty);
            if (string.IsNullOrWhiteSpace(srcSet))
            {
                continue;
            }

            // "a.jpg 320w, b.jpg 1024w" or "a.jpg 1x, b.jpg 2x" — pick the largest descriptor.
            var best = srcSet
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(entry => entry.Split(' ', StringSplitOptions.RemoveEmptyEntries))
                .Where(parts => parts.Length > 0 && !parts[0].StartsWith("data:", StringComparison.OrdinalIgnoreCase))
                .Select(parts => (Url: parts[0], Size: parts.Length > 1 ? ParseDescriptor(parts[1]) : 1))
                .OrderByDescending(entry => entry.Size)
                .FirstOrDefault();

            if (!string.IsNullOrEmpty(best.Url))
            {
                return best.Url;
            }
        }

        return null;
    }

    private static double ParseDescriptor(string descriptor) =>
        double.TryParse(descriptor.TrimEnd('w', 'x', 'W', 'X'), System.Globalization.NumberStyles.Float,
            System.Globalization.CultureInfo.InvariantCulture, out var value)
            ? value
            : 0;

    private static List<ImageCandidate> GetCheck24Specific(HtmlDocument doc)
    {
        var candidates = new List<ImageCandidate>();

        var imageNodes = doc.DocumentNode.SelectNodes("//div[contains(@id, 'imageTilesContainer')]//div[@style]");
        if (imageNodes is null)
        {
            return candidates;
        }

        foreach (var node in imageNodes)
        {
            // background images: url("…"), url('…'), url(&quot;…&quot;) or url(…)
            var match = CssUrlRegex().Match(node.GetAttributeValue("style", ""));
            if (match.Success)
            {
                candidates.Add(new ImageCandidate { Src = match.Groups["url"].Value });
            }
        }

        return candidates;
    }

    private static List<ImageCandidate> GetAmazonSpecific(HtmlDocument doc)
    {
        var candidates = new List<ImageCandidate>();

        // data-a-dynamic-image holds a JSON dict of {url: [w,h]}
        var dynamicImageNodes = doc.DocumentNode.SelectNodes("//img[@data-a-dynamic-image]");
        if (dynamicImageNodes is null)
        {
            return candidates;
        }

        foreach (var node in dynamicImageNodes)
        {
            var raw = System.Web.HttpUtility.HtmlDecode(node.GetAttributeValue("data-a-dynamic-image", ""));
            if (string.IsNullOrWhiteSpace(raw))
            {
                continue;
            }

            try
            {
                var dict = JsonSerializer.Deserialize<Dictionary<string, int[]>>(raw);
                if (dict is null)
                {
                    continue;
                }

                candidates.AddRange(dict
                    .Where(kv => kv.Value.ElementAtOrDefault(0) > 0 && kv.Value.ElementAtOrDefault(1) > 0)
                    .Select(kv => new ImageCandidate
                    {
                        Src = kv.Key,
                        Width = kv.Value[0],
                        Height = kv.Value[1]
                    }));
            }
            catch (JsonException)
            {
                // malformed/partial JSON, skip
            }
        }

        return candidates;
    }

    private static List<string> Resolve(IEnumerable<ImageCandidate> candidates, Uri baseUri) =>
        candidates
            .Select(c => HtmlUrlResolver.Resolve(baseUri, c.Src))
            .OfType<string>()
            .Distinct()
            .ToList();

    private static int GetDimension(HtmlNode node, string dimension)
    {
        var values = new List<int>();

        if (int.TryParse(node.GetAttributeValue(dimension, ""), out var attrVal))
        {
            values.Add(attrVal);
        }

        var style = node.GetAttributeValue("style", "");
        if (!string.IsNullOrWhiteSpace(style))
        {
            foreach (var prop in new[] { dimension, $"max-{dimension}", $"min-{dimension}" })
            {
                var match = Regex.Match(style, $@"{Regex.Escape(prop)}\s*:\s*(\d+)px", RegexOptions.IgnoreCase);
                if (match.Success && int.TryParse(match.Groups[1].Value, out var styleVal))
                {
                    values.Add(styleVal);
                }
            }
        }

        return values.Count > 0 ? values.Max() : 0;
    }

    // Icons, sprites, tracking pixels and vector graphics (whose size we cannot read) are never previews.
    [GeneratedRegex(@"sprite|icon|pixel|1x1|blank\.gif|spacer|\.svg(\?|$)", RegexOptions.IgnoreCase)]
    private static partial Regex JunkImageRegex();

    [GeneratedRegex(@"preview|landing|hero|main[-_]?image|product[-_]?image|gallery|og[-_]image", RegexOptions.IgnoreCase)]
    private static partial Regex PromisingHintRegex();

    [GeneratedRegex(@"logo|avatar|badge|banner|advert|\bads?\b|payment|flag|rating|star", RegexOptions.IgnoreCase)]
    private static partial Regex UnlikelyHintRegex();

    [GeneratedRegex(@"url\((?:&quot;|['""])?(?<url>https://.*?)(?:&quot;|['""])?\)", RegexOptions.IgnoreCase)]
    private static partial Regex CssUrlRegex();

    [GeneratedRegex(@"\p{L}+")]
    private static partial Regex WordRegex();
}
