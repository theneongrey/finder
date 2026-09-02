using Finder.Business.Auth.Setup;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Finder.Business.Shared.Services;

public class MailService(IOptions<SmtpOptions> smtpOptions, MailTemplateService mailTemplateService)
{
    private readonly SmtpOptions _smtpOptions = smtpOptions.Value;

    public virtual async Task SendAsync(Mail mail)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Finder", _smtpOptions.User));
        message.To.Add(new MailboxAddress(mail.RecipientName, mail.RecipientEmail));
        message.Subject = mail.Subject;
        message.Body = new TextPart("html") { Text = mail.Template.Build(mailTemplateService) };

        using var client = new SmtpClient();
        await client.ConnectAsync(_smtpOptions.Host, _smtpOptions.Port, true);
        await client.AuthenticateAsync(_smtpOptions.User, _smtpOptions.Password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
