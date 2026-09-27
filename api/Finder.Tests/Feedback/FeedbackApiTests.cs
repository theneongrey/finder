using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Finder.Business.Feedback.Setup;
using Finder.Business.Shared.Services;
using Finder.Tests.Infrastructure;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Finder.Tests.Feedback;

public class FeedbackApiTests : IClassFixture<FinderApiFactory>
{
    private const string Recipient = "feedback@test.com";

    private readonly FinderApiFactory _factory;

    public FeedbackApiTests(FinderApiFactory factory) => _factory = factory;

    // Child factory with a capturing MailService and a configured feedback recipient.
    private WebApplicationFactory<Program> CreateFactory(out CapturingMailService mail, string recipient = Recipient)
    {
        var captured = new CapturingMailService();
        mail = captured;
        return _factory.WithWebHostBuilder(b => b.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(MailService));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            services.AddSingleton<MailService>(captured);
            services.Configure<FeedbackOptions>(o => o.RecipientEmail = recipient);
        }));
    }

    private static HttpClient AuthenticatedClient(WebApplicationFactory<Program> factory, Guid userId)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, userId.ToString());
        return client;
    }

    // --- GET/PUT /api/feedback/preference ---

    [Fact]
    public async Task GetPreference_WithoutStoredRow_ReturnsButtonVisible()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync("/api/feedback/preference");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.False(json["buttonHidden"]!.GetValue<bool>());
        Assert.Null(json["feedbackDisabledUntil"]);
    }

    [Fact]
    public async Task UpdatePreference_PersistsValue()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var hide = await client.PutAsJsonAsync("/api/feedback/preference", new { buttonHidden = true });
        Assert.Equal(HttpStatusCode.OK, hide.StatusCode);

        var afterHide = JsonNode.Parse(await client.GetStringAsync("/api/feedback/preference"))!;
        Assert.True(afterHide["buttonHidden"]!.GetValue<bool>());

        // Updating an existing row (not just inserting) must work too.
        await client.PutAsJsonAsync("/api/feedback/preference", new { buttonHidden = false });
        var afterShow = JsonNode.Parse(await client.GetStringAsync("/api/feedback/preference"))!;
        Assert.False(afterShow["buttonHidden"]!.GetValue<bool>());
    }

    [Fact]
    public async Task GetPreference_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/feedback/preference");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- POST /api/feedback ---

    [Theory]
    [InlineData("", "/polls")]
    [InlineData("   ", "/polls")]
    [InlineData("ok", "")]
    public async Task SubmitFeedback_WithMissingFields_Returns400(string comment, string page)
    {
        var user = await _factory.SeedUser();
        await using var factory = CreateFactory(out var mail);
        using var client = AuthenticatedClient(factory, user.Id);

        var response = await client.PostAsJsonAsync("/api/feedback", new { type = "Other", comment, page });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(mail.SentMails);
    }

    [Fact]
    public async Task SubmitFeedback_WithTooLongComment_Returns400()
    {
        var user = await _factory.SeedUser();
        await using var factory = CreateFactory(out var mail);
        using var client = AuthenticatedClient(factory, user.Id);

        var response = await client.PostAsJsonAsync("/api/feedback",
            new { type = "Other", comment = new string('x', 2001), page = "/polls" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(mail.SentMails);
    }

    [Fact]
    public async Task SubmitFeedback_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/feedback",
            new { type = "Bug", comment = "hi", page = "/polls" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
