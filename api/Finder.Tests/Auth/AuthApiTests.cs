using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Finder.Tests.Infrastructure;
using Xunit;

namespace Finder.Tests.Auth;

public class AuthApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public AuthApiTests(FinderApiFactory factory) => _factory = factory;

    // --- GET /api/auth/who ---

    [Fact]
    public async Task GetUser_WhenUnauthenticated_ReturnsEmptyPerson()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/auth/who");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.False(json["isAuthenticated"]!.GetValue<bool>());
    }

    [Fact]
    public async Task GetUser_WhenAuthenticated_ReturnsPerson()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.GetAsync("/api/auth/who");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = JsonNode.Parse(await response.Content.ReadAsStringAsync())!;
        Assert.True(json["isAuthenticated"]!.GetValue<bool>());
        Assert.Equal(user.Email, json["email"]!.GetValue<string>());
    }

    // --- POST /api/auth/logout ---

    [Fact]
    public async Task Logout_ReturnsOk()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsync("/api/auth/logout", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // --- POST /api/auth/requestLoginMail ---

    [Fact]
    public async Task RequestLoginMail_WithKnownEmail_ReturnsOk()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/requestLoginMail",
            new { email = user.Email, redirectUrl = (string?)null });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task RequestLoginMail_CalledTwice_ReturnsOk()
    {
        var user = await _factory.SeedUser();
        using var client = _factory.CreateClient();

        var first = await client.PostAsJsonAsync("/api/auth/requestLoginMail",
            new { email = user.Email, redirectUrl = (string?)null });
        var second = await client.PostAsJsonAsync("/api/auth/requestLoginMail",
            new { email = user.Email, redirectUrl = (string?)null });

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
    }

    [Fact]
    public async Task RequestLoginMail_WithExistingToken_ReturnsOk()
    {
        var user = await _factory.SeedUser();
        var token = Guid.NewGuid().ToString("N").ToLower();
        await _factory.SeedLoginToken(user.Id, token, "123456");
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/requestLoginMail",
            new { email = user.Email, redirectUrl = (string?)null });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task RequestLoginMail_WithMultipleExistingTokens_ReturnsOk()
    {
        var user = await _factory.SeedUser();
        await _factory.SeedLoginToken(user.Id, Guid.NewGuid().ToString("N").ToLower(), "111111");
        await _factory.SeedLoginToken(user.Id, Guid.NewGuid().ToString("N").ToLower(), "222222");
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/requestLoginMail",
            new { email = user.Email, redirectUrl = (string?)null });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task RequestLoginMail_WithUnknownEmail_ReturnsForbid()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/requestLoginMail",
            new { email = $"{Guid.NewGuid()}@unknown.com", redirectUrl = (string?)null });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // --- POST /api/auth/tokenLogin ---

    [Fact]
    public async Task TokenLogin_WithValidToken_ReturnsOk()
    {
        var user = await _factory.SeedUser();
        var token = Guid.NewGuid().ToString("N").ToLower();
        await _factory.SeedLoginToken(user.Id, token, "123456");
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/tokenLogin", new { loginToken = token });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task TokenLogin_WithInvalidToken_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/tokenLogin",
            new { loginToken = "nonexistent-token" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- POST /api/auth/codeLogin ---

    [Fact]
    public async Task CodeLogin_WithValidCode_ReturnsOk()
    {
        var user = await _factory.SeedUser();
        var token = Guid.NewGuid().ToString("N").ToLower();
        await _factory.SeedLoginToken(user.Id, token, "654321");
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/codeLogin",
            new { email = user.Email, loginCode = "654321" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CodeLogin_WithInvalidCode_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/codeLogin",
            new { email = $"{Guid.NewGuid()}@unknown.com", loginCode = "000000" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
