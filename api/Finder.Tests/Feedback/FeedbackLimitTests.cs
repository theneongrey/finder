using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Finder.Business.Auth.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Finder.Tests.Feedback;

public class FeedbackLimitTests
{
    // Spacing that stays clear of the 30-second burst detection.
    private static readonly TimeSpan Spacing = TimeSpan.FromMinutes(1);

    [Fact]
    public async Task Submit_SixthWithin30Minutes_Returns429()
    {
        await using var host = new FeedbackTestHost();
        var user = await host.SeedUser();
        using var client = host.Client(user.Id);

        for (var i = 0; i < 5; i++)
        {
            Assert.Equal(HttpStatusCode.NoContent, (await FeedbackTestHost.Submit(client, $"#{i}")).StatusCode);
            host.Clock.Advance(Spacing);
        }

        Assert.Equal(HttpStatusCode.TooManyRequests, (await FeedbackTestHost.Submit(client)).StatusCode);

        // Once the oldest leaves the 30-minute window, one more is allowed.
        host.Clock.Advance(TimeSpan.FromMinutes(26));
        Assert.Equal(HttpStatusCode.NoContent, (await FeedbackTestHost.Submit(client)).StatusCode);
        Assert.Equal(6, await host.WithDb(db => db.FeedbackSubmissions.CountAsync(s => s.PersonId == user.Id)));
    }

    [Fact]
    public async Task Submit_EleventhWithin24Hours_Returns429()
    {
        await using var host = new FeedbackTestHost();
        var user = await host.SeedUser();
        using var client = host.Client(user.Id);

        for (var i = 0; i < 10; i++)
        {
            Assert.Equal(HttpStatusCode.NoContent, (await FeedbackTestHost.Submit(client, $"#{i}")).StatusCode);
            // Two per 30-minute window keeps the short limit out of the way.
            host.Clock.Advance(TimeSpan.FromMinutes(16));
        }

        Assert.Equal(HttpStatusCode.TooManyRequests, (await FeedbackTestHost.Submit(client)).StatusCode);

        host.Clock.Advance(TimeSpan.FromHours(24));
        Assert.Equal(HttpStatusCode.NoContent, (await FeedbackTestHost.Submit(client)).StatusCode);
    }

    [Fact]
    public async Task Submit_ThreeWithin30Seconds_DisablesFeedbackFor24Hours()
    {
        await using var host = new FeedbackTestHost();
        var user = await host.SeedUser();
        using var client = host.Client(user.Id);

        Assert.Equal(HttpStatusCode.NoContent, (await FeedbackTestHost.Submit(client, "1")).StatusCode);
        host.Clock.Advance(TimeSpan.FromSeconds(10));
        Assert.Equal(HttpStatusCode.NoContent, (await FeedbackTestHost.Submit(client, "2")).StatusCode);
        host.Clock.Advance(TimeSpan.FromSeconds(10));
        Assert.Equal(HttpStatusCode.Forbidden, (await FeedbackTestHost.Submit(client, "3")).StatusCode);

        var preference = await host.WithDb(db => db.FeedbackPreferences.SingleAsync(p => p.PersonId == user.Id));
        Assert.Equal(1, preference.ScriptStrikes);
        // The burst-completing submission isn't stored.
        Assert.Equal(2, await host.WithDb(db => db.FeedbackSubmissions.CountAsync(s => s.PersonId == user.Id)));

        var json = JsonNode.Parse(await client.GetStringAsync("/api/feedback/preference"))!;
        Assert.NotNull(json["feedbackDisabledUntil"]);

        host.Clock.Advance(TimeSpan.FromHours(1));
        Assert.Equal(HttpStatusCode.Forbidden, (await FeedbackTestHost.Submit(client)).StatusCode);

        host.Clock.Advance(TimeSpan.FromHours(24));
        Assert.Equal(HttpStatusCode.NoContent, (await FeedbackTestHost.Submit(client)).StatusCode);
        json = JsonNode.Parse(await client.GetStringAsync("/api/feedback/preference"))!;
        Assert.Null(json["feedbackDisabledUntil"]);
    }

    [Fact]
    public async Task Submit_ParallelBurst_StoresAtMostTwo()
    {
        await using var host = new FeedbackTestHost();
        var user = await host.SeedUser();
        using var client = host.Client(user.Id);

        var responses = await Task.WhenAll(Enumerable.Range(0, 6).Select(i => FeedbackTestHost.Submit(client, $"#{i}")));

        Assert.Equal(2, responses.Count(r => r.StatusCode == HttpStatusCode.NoContent));
        Assert.Equal(4, responses.Count(r => r.StatusCode == HttpStatusCode.Forbidden));
        Assert.Equal(2, await host.WithDb(db => db.FeedbackSubmissions.CountAsync(s => s.PersonId == user.Id)));
    }

    [Fact]
    public async Task ThirdStrike_BlocksPersonAndPreventsLogin()
    {
        await using var host = new FeedbackTestHost();
        var user = await host.SeedUser();
        using var client = host.Client(user.Id);

        for (var strike = 1; strike <= 3; strike++)
        {
            await FeedbackTestHost.Submit(client);
            await FeedbackTestHost.Submit(client);
            Assert.Equal(HttpStatusCode.Forbidden, (await FeedbackTestHost.Submit(client)).StatusCode);

            var blocked = await host.WithDb(db => db.Persons.Where(p => p.Id == user.Id).Select(p => p.IsBlocked).SingleAsync());
            Assert.Equal(strike == 3, blocked);

            host.Clock.Advance(TimeSpan.FromHours(25));
        }

        // The block is visible to the cookie validation right away (cache invalidated).
        Assert.True(await host.WithScope(sp => sp.GetRequiredService<BlockedUserCache>().IsBlocked(user.Id)));

        using var anonymous = host.Factory.CreateClient();
        var loginMail = await anonymous.PostAsJsonAsync("/api/auth/requestLoginMail", new { email = user.Email, redirectUrl = (string?)null });
        Assert.Equal(HttpStatusCode.Forbidden, loginMail.StatusCode);
        Assert.Empty(host.Mail.SentMails);

        var token = Guid.NewGuid().ToString("N");
        await host.SeedLoginToken(user.Id, token, "123456");
        var tokenLogin = await anonymous.PostAsJsonAsync("/api/auth/tokenLogin", new { loginToken = token });
        Assert.Equal(HttpStatusCode.Unauthorized, tokenLogin.StatusCode);
        Assert.False(await host.WithDb(db => db.LoginTokens.AnyAsync(t => t.Token == token)));

        await host.SeedLoginToken(user.Id, Guid.NewGuid().ToString("N"), "654321");
        var codeLogin = await anonymous.PostAsJsonAsync("/api/auth/codeLogin", new { email = user.Email, loginCode = "654321" });
        Assert.Equal(HttpStatusCode.Unauthorized, codeLogin.StatusCode);
    }

    [Fact]
    public async Task BlockedUserCache_CachesUntilInvalidated()
    {
        await using var host = new FeedbackTestHost();
        var user = await host.SeedUser();

        await host.WithScope(async sp =>
        {
            var cache = sp.GetRequiredService<BlockedUserCache>();
            Assert.False(await cache.IsBlocked(user.Id));

            var db = sp.GetRequiredService<Finder.Database.AppDbContext>();
            await db.Persons.Where(p => p.Id == user.Id).ExecuteUpdateAsync(s => s.SetProperty(p => p.IsBlocked, true));

            Assert.False(await cache.IsBlocked(user.Id));
            cache.Invalidate(user.Id);
            Assert.True(await cache.IsBlocked(user.Id));
        });
    }
}
