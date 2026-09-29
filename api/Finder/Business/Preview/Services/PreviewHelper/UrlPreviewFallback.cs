using System.Globalization;
using System.Text.RegularExpressions;

namespace Finder.Business.Preview.Services.PreviewHelper;

/// <summary>
/// Last-resort preview derived from the URL alone, for pages we could not fetch (bot protection, timeouts).
/// Many shops and booking sites put a readable slug into the path, e.g.
/// <c>booking.com/hotel/de/adlon-kempinski.de.html</c> or <c>idealo.de/…/OffersOfProduct/123_-apple-iphone-17.html</c>.
/// </summary>
public static partial class UrlPreviewFallback
{
    public static Models.Preview FromUrl(Uri url)
    {
        return new Models.Preview(GetTitleFromPath(url), string.Empty, string.Empty, url.AbsoluteUri)
        {
            SiteName = GetSiteName(url)
        };
    }

    public static string GetSiteName(Uri url) =>
        url.Host.StartsWith("www.", StringComparison.OrdinalIgnoreCase) ? url.Host[4..] : url.Host;

    private static string GetTitleFromPath(Uri url)
    {
        return url.AbsolutePath
                   .Split('/', StringSplitOptions.RemoveEmptyEntries)
                   .Select(ToWords)
                   // A readable slug has at least two real words; "dp", "hotel" or "42" alone are not titles.
                   .Where(words => words.Count(word => word.Any(char.IsLetter)) >= 2)
                   .OrderByDescending(words => words.Count(word => word.Any(char.IsLetter)))
                   .Select(words => string.Join(' ', words.Select(Capitalize)))
                   .FirstOrDefault()
               ?? string.Empty;
    }

    private static List<string> ToWords(string segment)
    {
        var decoded = Uri.UnescapeDataString(segment);

        // strip file extensions and a trailing language code: "adlon-kempinski.de.html" -> "adlon-kempinski"
        decoded = FileExtensionRegex().Replace(decoded, string.Empty);
        decoded = LanguageSuffixRegex().Replace(decoded, string.Empty);
        // strip leading numeric ids: "123456_-apple-iphone" -> "apple-iphone"
        decoded = LeadingIdRegex().Replace(decoded, string.Empty);

        return WordSeparatorRegex()
            .Split(decoded)
            .Where(word => word.Length > 0 && !LooksLikeId(word))
            .ToList();
    }

    // Tokens like "B0FVX89SVD" or "a1b2c3d4" are ids, not words.
    private static bool LooksLikeId(string word) =>
        word.Count(char.IsDigit) >= 2 && word.Count(char.IsLetter) >= 2 && word.Length >= 6;

    private static string Capitalize(string word) =>
        word.Length == 0 ? word : char.ToUpper(word[0], CultureInfo.InvariantCulture) + word[1..];

    [GeneratedRegex(@"\.(html?|php|aspx?|jsp)$", RegexOptions.IgnoreCase)]
    private static partial Regex FileExtensionRegex();

    [GeneratedRegex(@"\.[a-z]{2}(-[a-z]{2})?$", RegexOptions.IgnoreCase)]
    private static partial Regex LanguageSuffixRegex();

    [GeneratedRegex(@"^\d+[_-]+")]
    private static partial Regex LeadingIdRegex();

    [GeneratedRegex(@"[-_+\s]+")]
    private static partial Regex WordSeparatorRegex();
}
