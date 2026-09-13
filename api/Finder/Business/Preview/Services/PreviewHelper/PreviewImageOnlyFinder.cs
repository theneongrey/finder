using System.Text.Json;
using System.Text.RegularExpressions;
using HtmlAgilityPack;

namespace Finder.Business.Preview.Services.PreviewHelper;

public class PreviewImageOnlyFinder
{
    class ImageCandidate
    {
        public string Src { get; set; } = "";
        public string Alt { get; set; } = "";
        public string Id { get; set; } = "";
        public string ClassName { get; set; } = "";
        public int Width { get; set; }
        public int Height { get; set; }
    }

    public string? GetMostPromisingImage(string htmlContent, string? title)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(htmlContent);

        var imgNodes = doc.DocumentNode.SelectNodes("//img");

        var candidates = GetAmazonSpecific(doc, imgNodes);
        if (candidates.Count > 0)
        {
            return PickLargestDynamicImage(candidates);
        }
        
        candidates = GetCheck24Specific(doc);
        if (candidates.Count > 0)
        {
            return candidates.First().Src;
        }

        foreach (var node in imgNodes)
        {
            var src = node.GetAttributeValue("src", "")
                is { Length: > 0 } s
                ? s
                : node.GetAttributeValue("data-src", "");

            if (string.IsNullOrWhiteSpace(src))
            {
                continue;
            }

            // Dedupe and drop obvious junk (icons, sprites, tracking pixels, base64 blobs)
            if (Regex.IsMatch(src, "sprite|icon|pixel|1x1|blank\\.gif", RegexOptions.IgnoreCase))
            {
                continue;
            }

            candidates.Add(new ImageCandidate
            {
                Src = src,
                Alt = node.GetAttributeValue("alt", ""),
                Id = node.GetAttributeValue("id", ""),
                ClassName = node.GetAttributeValue("class", ""),
                Width = GetDimension(node, "width"),
                Height = GetDimension(node, "height"),
            });
        }

        return PickMostPromising(candidates, title);
    }

    private List<ImageCandidate> GetCheck24Specific(HtmlDocument doc)
    {
        var candidates = new List<ImageCandidate>();
        
        var containerNode = doc.DocumentNode.SelectSingleNode("//div[contains(@id, 'imageTilesContainer')]");

        if (containerNode != null)
        {
            // 3. Find all child divs inside that container that possess a 'style' attribute
            var imageNodes = containerNode.SelectNodes(".//div[@style]");

            if (imageNodes != null)
            {
                // Regex pattern to safely isolate URLs inside url("...") or url(...)
                // It accounts for escaped quotes like &quot; or standard quotes
                Regex urlRegex = new Regex(@"url\((?:&quot;|['""])?(?<url>https://.*?)(?:&quot;|['""])?\)", RegexOptions.Compiled | RegexOptions.IgnoreCase);

                foreach (var node in imageNodes)
                {
                    string styleAttr = node.GetAttributeValue("style", "");
                    Match match = urlRegex.Match(styleAttr);

                    if (match.Success)
                    {
                        string cleanUrl = match.Groups["url"].Value;
                        candidates.Add(new ImageCandidate
                        {
                            Src = cleanUrl
                        });
                        
                        Console.WriteLine($"Found Preview Image: {cleanUrl}");
                    }
                }
            }
            else
            {
                Console.WriteLine("No style-bearing child divs found inside the container.");
            }
        }
        else
        {
            Console.WriteLine("Could not find a div with the class 'imageTilesContainer'.");
        }

        return candidates;
    }

    private List<ImageCandidate> GetAmazonSpecific(HtmlDocument doc, HtmlNodeCollection imgNodes)
    {
        var candidates = new List<ImageCandidate>();
        
        // --- Amazon-specific: data-a-dynamic-image holds a JSON dict of {url: [w,h]} ---
        var dynamicImageNodes = doc.DocumentNode.SelectNodes("//img[@data-a-dynamic-image]");
        if (dynamicImageNodes is not null)
        {
            foreach (var node in dynamicImageNodes)
            {
                var raw = node.GetAttributeValue("data-a-dynamic-image", "");
                if (string.IsNullOrWhiteSpace(raw))
                {
                    continue;
                }

                try
                {
                    // Amazon HTML-encodes the JSON, HtmlAgilityPack usually decodes it already
                    var dict = JsonSerializer.Deserialize<Dictionary<string, int[]>>(raw);
                    if (dict == null)
                    {
                        continue;
                    }

                    foreach (var kv in dict)
                    {
                        candidates.Add(new ImageCandidate
                        {
                            Src = kv.Key,
                            Width = kv.Value.ElementAtOrDefault(0),
                            Height = kv.Value.ElementAtOrDefault(1),
                            Alt = node.GetAttributeValue("alt", ""),
                            Id = node.GetAttributeValue("id", ""),
                            ClassName = node.GetAttributeValue("class", "")
                        });
                    }
                }
                catch (JsonException)
                {
                    // malformed/partial JSON, skip
                }
            }
        }

        return candidates;
    }

    private string? PickLargestDynamicImage(IEnumerable<ImageCandidate> candidates)
    {
        return candidates
            .Where(c => c.Width > 0 && c.Height > 0)
            .OrderByDescending(c => c.Width * c.Height)
            .FirstOrDefault()?.Src;
    }

    private string? PickMostPromising(List<ImageCandidate> candidates, string? title)
    {
        var previewCandidates = candidates.Where(c =>
        {
            var stringContent = c.Alt + c.Id + c.ClassName + c.Src;
            return stringContent.Contains("preview") || stringContent.Contains("landing") ||
                   (title != null && stringContent.Contains(title));
        }).ToList();

        if (previewCandidates.Any())
        {
            var result = PickLargestDynamicImage(previewCandidates);
            if (result is not null)
            {
                return result;
            }
        }

        var largest = PickLargestDynamicImage(candidates);
        if (largest is not null)
        {
            return largest;
        }

        return candidates.FirstOrDefault()?.Src;
    }

    private int GetDimension(HtmlNode node, string dimension)
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
}