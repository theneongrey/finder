using System.Net.Http.Json;
using Finder.Database;
using Finder.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Finder.Tests.Auth;

public class LoginSeedingTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public LoginSeedingTests(FinderApiFactory factory) => _factory = factory;

    [Fact]
    public async Task TokenLogin_OnFirstLogin_SeedsNotificationSettings()
    {
        var user = await _factory.SeedUser();
        var token = Guid.NewGuid().ToString("N").ToLower();
        await _factory.SeedLoginToken(user.Id, token, "123456");
        using var client = _factory.CreateClient();

        await client.PostAsJsonAsync("/api/auth/tokenLogin", new { loginToken = token });

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var count = await db.PersonNotificationSettings.CountAsync(p => p.PersonId == user.Id);
        Assert.Equal(6, count);
    }

    [Fact]
    public async Task TokenLogin_OnFirstLogin_SetsHasLoggedIn()
    {
        var user = await _factory.SeedUser();
        var token = Guid.NewGuid().ToString("N").ToLower();
        await _factory.SeedLoginToken(user.Id, token, "123456");
        using var client = _factory.CreateClient();

        await client.PostAsJsonAsync("/api/auth/tokenLogin", new { loginToken = token });

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var person = await db.Persons.FindAsync(user.Id);
        Assert.True(person!.HasLoggedIn);
    }

    [Fact]
    public async Task CodeLogin_OnFirstLogin_SeedsNotificationSettings()
    {
        var user = await _factory.SeedUser();
        var token = Guid.NewGuid().ToString("N").ToLower();
        await _factory.SeedLoginToken(user.Id, token, "654321");
        using var client = _factory.CreateClient();

        await client.PostAsJsonAsync("/api/auth/codeLogin", new { email = user.Email, loginCode = "654321" });

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var count = await db.PersonNotificationSettings.CountAsync(p => p.PersonId == user.Id);
        Assert.Equal(6, count);
    }
}
