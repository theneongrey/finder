using System.Reflection;

namespace Finder.Business.Shared.Services;

public class MailTemplateService
{
    private readonly Assembly _assembly = typeof(MailTemplateService).Assembly;

    public string Render(string templateName, string language, Dictionary<string, string> variables)
    {
        var html = LoadTemplate(templateName, language);
        foreach (var (key, value) in variables)
            html = html.Replace($"{{{{{key}}}}}", value);
        return html;
    }

    private string LoadTemplate(string templateName, string language)
    {
        var stream = GetStream(language, templateName) ?? GetStream("en", templateName);
        if (stream is null)
            throw new InvalidOperationException($"Email template '{templateName}' not found.");

        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }

    private Stream? GetStream(string language, string templateName) =>
        _assembly.GetManifestResourceStream($"Finder.Business.Shared.Templates.{language}.{templateName}.html");
}
