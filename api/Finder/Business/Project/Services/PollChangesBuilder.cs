using System.Net;
using System.Text;
using Finder.Business.Shared.Services;

namespace Finder.Business.Project.Services;

public class PollChangesBuilder(LanguageService languageService)
{
    public string Build(PollUpdateSummary summary, string language)
    {
        var items = new List<string>();

        if (summary.NameChanged)
            items.Add(string.Format(
                languageService.Get("poll.changes.name", language),
                $"<em>{WebUtility.HtmlEncode(summary.OldName)}</em>",
                $"<strong>{WebUtility.HtmlEncode(summary.NewName)}</strong>"));

        if (summary.DescriptionChanged)
            items.Add(languageService.Get("poll.changes.description", language));

        foreach (var text in summary.OptionsAdded)
            items.Add(string.Format(
                languageService.Get("poll.changes.option.added", language),
                $"<strong>{WebUtility.HtmlEncode(text)}</strong>"));

        foreach (var text in summary.OptionsRemoved)
            items.Add(string.Format(
                languageService.Get("poll.changes.option.removed", language),
                $"<strong>{WebUtility.HtmlEncode(text)}</strong>"));

        if (summary.OptionsModified)
            items.Add(languageService.Get("poll.changes.option.modified", language));

        if (items.Count == 0) return "";

        var sb = new StringBuilder("<ul style=\"margin:16px 0 4px;padding-left:20px;\">");
        foreach (var item in items)
            sb.Append($"<li style=\"margin:4px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#5a5650;\">{item}</li>");
        sb.Append("</ul>");
        return sb.ToString();
    }
}
