using Finder.Business.Auth.Entities;
using Finder.Business.Auth.Setup;
using Finder.Business.Shared.Services;
using Microsoft.Extensions.Options;

namespace Finder.Business.Auth.Services;

public class LoginMailService(MailService mailService, LanguageService languageService, IOptions<LoginOptions> loginOptions)
{
    private readonly LoginOptions _loginOptions = loginOptions.Value;

    public async Task SendLoginMail(Person person, LoginToken token)
    {
        if (person.Role == Role.TestUser)
        {
            return;
        }

        var loginLink = _loginOptions.LoginLink
            .Replace("{{token}}", token.Token)
            .Replace("{{redirecturl}}", token.RedirectUrl);

        var (subjectKey, preheaderKey, templateName) = person.HasLoggedIn
            ? ("login.subject", "login.preheader", "login")
            : ("login.subject.new", "login.preheader.new", "login-new");

        var mail = new Mail(
            languageService.Get(subjectKey),
            person.Name ?? person.Email,
            person.Email,
            new MailTemplate(templateName, "en", new Dictionary<string, string>
            {
                ["code"] = token.Code ?? string.Empty,
                ["link"] = loginLink
            }, languageService.Get(preheaderKey))
        );

        try
        {
            await mailService.SendAsync(mail);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error while sending mail: " + ex.Message);
        }
    }
}
