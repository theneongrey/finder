using Finder.Business.Auth.Entities;
using Finder.Business.Auth.Setup;
using Finder.Business.Shared.Services;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Finder.Business.Permission.Services;

public class MailService
{
    private SmtpOptions _smtpOptions;
    private MailTemplateService _mailTemplateService;

    public MailService(IOptions<SmtpOptions> stmpOptions, MailTemplateService mailTemplateService)
    {
        _smtpOptions = stmpOptions.Value;
        _mailTemplateService = mailTemplateService;
    }

    public async Task SendMail(Person recipient, string userName, string project, string permission,
        string subject, string templateName, string language = "en")
    {
        if (recipient.Role == Role.TestUser)
        {
            return;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Finder", _smtpOptions.User));
            message.To.Add(new MailboxAddress("Finder User", recipient.Email));

            message.Subject = subject;
            message.Body = new TextPart("html")
            {
                Text = _mailTemplateService.Render(templateName, language, new Dictionary<string, string>
                {
                    ["recipient"] = recipient.Name ?? recipient.Email,
                    ["user"] = userName,
                    ["project"] = project,
                    ["permission"] = permission
                })
            };

            using var client = new SmtpClient();
            await client.ConnectAsync(_smtpOptions.Host, _smtpOptions.Port, true);
            await client.AuthenticateAsync(_smtpOptions.User, _smtpOptions.Password);

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error while sending mail: " + ex.Message);
        }
    }
}
