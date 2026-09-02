using Finder.Business.Auth.Setup;
using Finder.Business.Shared.Services;
using Microsoft.Extensions.Options;

namespace Finder.Tests.Infrastructure;

public sealed class CapturingMailService()
    : MailService(
        Options.Create(new SmtpOptions { Host = "localhost", Port = 25, User = "test@test.com", Password = "test" }),
        new MailTemplateService())
{
    public List<Mail> SentMails { get; } = [];

    public override Task SendAsync(Mail mail)
    {
        SentMails.Add(mail);
        return Task.CompletedTask;
    }
}
