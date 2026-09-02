using System.Text.RegularExpressions;

namespace Finder.Business.Shared;

public static partial class HtmlSanitizer
{
    [GeneratedRegex("<[^>]*>")]
    private static partial Regex HtmlTagPattern();

    public static string StripHtml(this string input) =>
        HtmlTagPattern().Replace(input, string.Empty);
}
