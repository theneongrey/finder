using Microsoft.Extensions.Options;

namespace Finder.Business.Shared.Services;

public class I18nOptions : Dictionary<string, Dictionary<string, string>> { }

public class LanguageService(IOptions<I18nOptions> options)
{
    private readonly I18nOptions _translations = options.Value;

    public string Get(string key, string language = "en")
    {
        if (_translations.TryGetValue(language, out var dict) && dict.TryGetValue(key, out var value))
        {
            return value;
        }

        if (_translations.TryGetValue("en", out var enDict) && enDict.TryGetValue(key, out var enValue))
        {
            return enValue;
        }

        return key;
    }
}
