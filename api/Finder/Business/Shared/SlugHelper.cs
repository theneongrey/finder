using System.Text.RegularExpressions;

namespace Finder.Business.Shared;

public static class SlugHelper
{
    public static string GenerateId() => Guid.NewGuid().ToString("N")[..8];

    public static string ExtractId(string slug) => slug.Split('-')[^1];

    public static string ToSlug(string name, string id)
    {
        var clean = Regex.Replace(name.ToLowerInvariant(), @"[^a-z0-9\s]", "");
        var nameSlug = Regex.Replace(clean.Trim(), @"\s+", "-");
        if (string.IsNullOrEmpty(nameSlug)) nameSlug = "item";
        return $"{nameSlug}-{id}";
    }

    public static string OptionSlugName(string text) =>
        text.Contains(';') ? text.Split(';')[0] : text;
}
