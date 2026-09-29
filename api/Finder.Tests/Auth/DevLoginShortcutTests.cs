using System.Net;
using System.Net.Http.Json;
using Finder.Business.Auth.Entities;
using Finder.Database;
using Finder.Tests.Infrastructure;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Finder.Tests.Auth;

/// <summary>
/// The dev-only fixed login token/code (Login:AuthToken / Login:AuthCode) apply to TestUser
/// accounts only, so test logins can't clear a real account's pending code.
/// </summary>
public class DevLoginShortcutTests : IClassFixture<FinderApiFactory>
{
    private const string StaticToken = "dev-static-token";
    private const string StaticCode = "123456";

    private readonly WebApplicationFactory<Program> _factory;
    private readonly FinderApiFactory _baseFactory;

    public DevLoginShortcutTests(FinderApiFactory factory)
    {
        _baseFactory = factory;
        _factory = factory.WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Login:AuthToken"] = StaticToken,
                    ["Login:AuthCode"] = StaticCode,
                })));
    }

    [Fact]
    public async Task TestUser_CanLogInWithStaticCode()
    {
        var user = await _baseFactory.SeedUser(role: Role.TestUser);
        using var client = _factory.CreateClient();

        await client.PostAsJsonAsync("/api/auth/requestLoginMail",
            new { email = user.Email, redirectUrl = (string?)null });
        var response = await client.PostAsJsonAsync("/api/auth/codeLogin",
            new { email = user.Email, loginCode = StaticCode });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task RealUser_DoesNotGetStaticToken()
    {
        var user = await _baseFactory.SeedUser();
        using var client = _factory.CreateClient();

        await client.PostAsJsonAsync("/api/auth/requestLoginMail",
            new { email = user.Email, redirectUrl = (string?)null });
        var response = await client.PostAsJsonAsync("/api/auth/tokenLogin",
            new { loginToken = StaticToken });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task TestUserLogin_KeepsRealUsersPendingCode()
    {
        var realUser = await _baseFactory.SeedUser();
        var testUser = await _baseFactory.SeedUser(role: Role.TestUser);
        using var client = _factory.CreateClient();

        await client.PostAsJsonAsync("/api/auth/requestLoginMail",
            new { email = realUser.Email, redirectUrl = (string?)null });
        var realCode = await PendingCode(realUser.Id);
        await client.PostAsJsonAsync("/api/auth/requestLoginMail",
            new { email = testUser.Email, redirectUrl = (string?)null });
        var response = await client.PostAsJsonAsync("/api/auth/codeLogin",
            new { email = realUser.Email, loginCode = realCode });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<string> PendingCode(Guid personId)
    {
        using var scope = _baseFactory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var token = await db.LoginTokens.SingleAsync(t => t.Person.Id == personId);
        return token.Code!;
    }
}
