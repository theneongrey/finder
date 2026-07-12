using Finder.Business.Auth.Entities;
using Finder.Business.Auth.Setup;
using Finder.Business.Permission.Setup;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Finder.Business.Permission.Services;

public class MailService
{
    private SmtpOptions _smtpOptions;

    public MailService(IOptions<SmtpOptions> stmpOptions)
    {
        _smtpOptions = stmpOptions.Value;
    }

    public async Task SendMail(Person recipient, string userName, string project, string permission, MailTemplate mailTemplate)
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
            
            var body = mailTemplate.Text
                .Replace("{{recipient}}", recipient.Name)
                .Replace("{{user}}", userName)
                .Replace("{{project}}", project)
                .Replace("{{permission}}", permission);
            
            message.Subject = mailTemplate.Subject;
            message.Body = new TextPart("html")
            {
                Text = $"<p>{body}</p>"
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