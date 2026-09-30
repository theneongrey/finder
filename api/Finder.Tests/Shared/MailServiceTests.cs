using Finder.Business.Auth.Setup;
using Finder.Business.Shared.Services;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using MimeKit;
using Xunit;

namespace Finder.Tests.Shared;

public class MailServiceTests
{
    private static SmtpOptions Bind(Dictionary<string, string?> values)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();
        var services = new ServiceCollection();
        services.Configure<SmtpOptions>(configuration.GetSection("Smtp"));
        return services.BuildServiceProvider().GetRequiredService<IOptions<SmtpOptions>>().Value;
    }

    private static readonly Dictionary<string, string?> BaseSettings = new()
    {
        ["Smtp:Host"] = "smtp.example.com",
        ["Smtp:Port"] = "465",
        ["Smtp:User"] = "noreply@example.com",
        ["Smtp:Password"] = "secret"
    };

    [Fact]
    public void Options_default_to_implicit_tls_and_votean_sender()
    {
        var options = Bind(BaseSettings);

        Assert.Equal(SecureSocketOptions.SslOnConnect, options.SecureSocketOptions);
        Assert.Equal("Votean", options.FromName);
    }

    [Fact]
    public void Options_bind_starttls_and_custom_sender_name()
    {
        var options = Bind(new Dictionary<string, string?>(BaseSettings)
        {
            ["Smtp:Port"] = "587",
            ["Smtp:SecureSocketOptions"] = "StartTls",
            ["Smtp:FromName"] = "Votean Staging"
        });

        Assert.Equal(SecureSocketOptions.StartTls, options.SecureSocketOptions);
        Assert.Equal("Votean Staging", options.FromName);
    }

    [Fact]
    public void BuildMessage_uses_configured_sender_name_and_address()
    {
        var service = new MailService(Options.Create(Bind(BaseSettings)), new MailTemplateService());
        var mail = new Mail("Subject", "Recipient", "recipient@example.com",
            new MailTemplate("feedback-digest", "en", new Dictionary<string, string>()));

        var message = service.BuildMessage(mail);

        var sender = Assert.IsType<MailboxAddress>(Assert.Single(message.From));
        Assert.Equal("Votean", sender.Name);
        Assert.Equal("noreply@example.com", sender.Address);
    }
}
