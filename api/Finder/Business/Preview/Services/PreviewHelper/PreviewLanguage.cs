using System.Text.RegularExpressions;

namespace Finder.Business.Preview.Services.PreviewHelper;

/// <summary>Forwards the user's Accept-Language to the previewed site, so titles come back in their language.</summary>
public static partial class PreviewLanguage
{
    public const string Default = "en-US,en;q=0.9";

    /// <summary>The header to send upstream: the caller's header if it is well-formed, else <see cref="Default"/>.</summary>
    public static string Normalize(string? acceptLanguage) =>
        !string.IsNullOrWhiteSpace(acceptLanguage) && AcceptLanguageRegex().IsMatch(acceptLanguage)
            ? acceptLanguage
            : Default;

    /// <summary>The first language tag of a normalized header, e.g. "de-DE" — used as the browser locale.</summary>
    public static string PrimaryLocale(string acceptLanguage) =>
        acceptLanguage.Split(',', ';')[0].Trim() is { Length: > 0 } tag && tag != "*" ? tag : "en-US";

    [GeneratedRegex(@"^[a-zA-Z0-9\-,;=.* ]{1,128}$")]
    private static partial Regex AcceptLanguageRegex();
}
