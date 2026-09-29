using Finder.Business.Auth.Setup;
using Finder.Business.Feedback.Services;
using Finder.Business.Shared.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace Finder.Tests.Feedback;

public class FeedbackDigestTests
{
    // Start is 10:00 Berlin; 17:00 Berlin (CEST) is 15:00 UTC.
    private static readonly TimeSpan UntilCutoff = TimeSpan.FromHours(7);

    private static Task RunDigest(FeedbackTestHost host) =>
        host.WithScope(sp => sp.GetRequiredService<FeedbackDigestService>().SendPendingDigest());

    private static Task<int> PendingCount(FeedbackTestHost host) =>
        host.WithDb(db => db.FeedbackSubmissions.CountAsync(s => s.SentAt == null));

    private static async Task SubmitTwo(FeedbackTestHost host, Guid userId, string first = "First", string second = "Second")
    {
        using var client = host.Client(userId);
        await FeedbackTestHost.Submit(client, first, "Bug");
        host.Clock.Advance(TimeSpan.FromMinutes(1));
        await FeedbackTestHost.Submit(client, second, "Idea", "/settings");
    }

    [Fact]
    public async Task Submit_StoresFeedbackWithoutSendingMail()
    {
        await using var host = new FeedbackTestHost();
        var user = await host.SeedUser();
        using var client = host.Client(user.Id);

        await FeedbackTestHost.Submit(client, "  Button is broken  ", "Bug", "/polls/abc");

        var stored = await host.WithDb(db => db.FeedbackSubmissions.SingleAsync());
        Assert.Equal("Button is broken", stored.Comment);
        Assert.Equal("/polls/abc", stored.Page);
        Assert.Equal(user.Id, stored.PersonId);
        Assert.Null(stored.SentAt);
        Assert.Empty(host.Mail.SentMails);
    }

    [Fact]
    public async Task Digest_BeforeCutoff_SendsNothing()
    {
        await using var host = new FeedbackTestHost();
        var user = await host.SeedUser();
        await SubmitTwo(host, user.Id);

        await RunDigest(host);

        Assert.Empty(host.Mail.SentMails);
        Assert.Equal(2, await PendingCount(host));
    }

    [Fact]
    public async Task Digest_AfterCutoff_SendsOneMailWithAllPendingOnce()
    {
        await using var host = new FeedbackTestHost();
        var user = await host.SeedUser();
        var other = await host.SeedUser();
        await SubmitTwo(host, user.Id, "Alpha", "Beta");
        await SubmitTwo(host, other.Id, "Gamma", "Delta");

        host.Clock.Advance(UntilCutoff);
        await RunDigest(host);

        var mail = Assert.Single(host.Mail.SentMails);
        Assert.Equal(FeedbackTestHost.Recipient, mail.RecipientEmail);
        Assert.Equal("4", mail.Template.Variables["count"]);
        var items = mail.Template.RawHtmlVariables?["items"] ?? "";
        foreach (var text in new[] { "Alpha", "Beta", "Gamma", "Delta", user.Email, other.Email, "/settings" })
        {
            Assert.Contains(text, items);
        }

        // Local submit time is shown in the digest time zone.
        Assert.Contains("2026-09-27 10:00 (Europe/Berlin)", items);
        Assert.Equal(0, await PendingCount(host));

        host.Clock.Advance(TimeSpan.FromMinutes(5));
        await RunDigest(host);
        Assert.Single(host.Mail.SentMails);
    }

    [Fact]
    public async Task Digest_SubmissionAfterCutoff_WaitsForNextDay()
    {
        await using var host = new FeedbackTestHost();
        var user = await host.SeedUser();
        host.Clock.Advance(UntilCutoff + TimeSpan.FromMinutes(10));
        await SubmitTwo(host, user.Id);

        await RunDigest(host);
        Assert.Empty(host.Mail.SentMails);

        host.Clock.Advance(TimeSpan.FromHours(24));
        await RunDigest(host);
        Assert.Single(host.Mail.SentMails);
    }

    [Fact]
    public async Task Digest_EncodesUserInputInRenderedMail()
    {
        await using var host = new FeedbackTestHost();
        var user = await host.SeedUser();
        using var client = host.Client(user.Id);
        await FeedbackTestHost.Submit(client, "<b>bold</b> & a < b {{count}}");

        host.Clock.Advance(UntilCutoff);
        await RunDigest(host);

        var t = Assert.Single(host.Mail.SentMails).Template;
        var html = new MailTemplateService().Render(t.Name, t.Language,
            new Dictionary<string, string>(t.Variables) { ["preheader"] = t.Preheader }, t.RawHtmlVariables);
        Assert.Contains("&lt;b&gt;bold&lt;/b&gt; &amp; a &lt; b {{count}}", html);
        Assert.DoesNotContain("<b>bold</b>", html);
    }

    [Fact]
    public async Task Digest_WithoutRecipient_KeepsRowsPending()
    {
        await using var host = new FeedbackTestHost(recipient: "");
        var user = await host.SeedUser();
        await SubmitTwo(host, user.Id);

        host.Clock.Advance(UntilCutoff);
        await RunDigest(host);

        Assert.Empty(host.Mail.SentMails);
        Assert.Equal(2, await PendingCount(host));
    }

    [Fact]
    public async Task Digest_WhenMailFails_KeepsRowsPendingForRetry()
    {
        await using var host = new FeedbackTestHost(mailService: new FailingMailService());
        var user = await host.SeedUser();
        await SubmitTwo(host, user.Id);

        host.Clock.Advance(UntilCutoff);
        await RunDigest(host);

        Assert.Equal(2, await PendingCount(host));
    }

    [Fact]
    public async Task Digest_PurgesRowsSentLongerThanRetentionAgo()
    {
        await using var host = new FeedbackTestHost();
        var user = await host.SeedUser();
        await SubmitTwo(host, user.Id);
        host.Clock.Advance(UntilCutoff);
        await RunDigest(host);
        Assert.Equal(2, await host.WithDb(db => db.FeedbackSubmissions.CountAsync()));

        host.Clock.Advance(FeedbackDigestService.Retention + TimeSpan.FromMinutes(1));
        await RunDigest(host);

        Assert.Equal(0, await host.WithDb(db => db.FeedbackSubmissions.CountAsync()));
    }

    private sealed class FailingMailService()
        : MailService(Options.Create(new SmtpOptions { Host = "localhost", Port = 25, User = "u", Password = "p" }), new MailTemplateService())
    {
        public override Task SendAsync(Mail mail) => throw new InvalidOperationException("SMTP down");
    }
}
