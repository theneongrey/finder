using Finder.Business.Auth.Entities;
using Finder.Business.Auth.Setup;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Finder.Business.Auth.Services;

public class MailService
{
    private SmtpOptions _smtpOptions;
    private LoginOptions _loginOptions;

    public MailService(IOptions<SmtpOptions> stmpOptions, IOptions<LoginOptions> loginOptions)
    {
        _smtpOptions = stmpOptions.Value;
        _loginOptions = loginOptions.Value;
    }

    public async Task SendLoginMail(Person person, LoginToken token)
    {
        try
        {
            var loginLink = _loginOptions.LoginLink.Replace("{{token}}", token.Token)
                .Replace("{{redirecturl", token.RedirectUrl);
            
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Finder", _smtpOptions.User));
            message.To.Add(new MailboxAddress("Finder User", person.Email));

            if (person.HasLoggedIn)
            {
                message.Subject = _loginOptions.Subject;
                message.Body = new TextPart("html")
                {
                    Text = $"<p>{_loginOptions.Text} {token.Code}</p><p><a href=\"{loginLink}\">Login</a></p>"
                };
            }
            else
            {
                message.Subject = _loginOptions.SubjectNew;
                message.Body = new TextPart("html")
                {
                    Text = $"<p>{_loginOptions.TextNew} {token.Code}</p><p><a href=\"{loginLink}\">Login</a></p>"
                };
            }

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