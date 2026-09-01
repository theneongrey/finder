namespace Finder.Business.Shared.Services;

public record MailTemplate(string Name, string Language, Dictionary<string, string> Variables, string Preheader = "")
{
    internal string Build(MailTemplateService service)
    {
        var vars = new Dictionary<string, string>(Variables) { ["preheader"] = Preheader };
        return service.Render(Name, Language, vars);
    }
}

public record Mail(string Subject, string RecipientName, string RecipientEmail, MailTemplate Template);
