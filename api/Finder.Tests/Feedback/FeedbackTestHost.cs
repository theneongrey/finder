using System.Net.Http.Json;
using Finder.Business.Feedback.Setup;
using Finder.Business.Shared.Services;
using Finder.Database;
using Finder.Tests.Infrastructure;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;

namespace Finder.Tests.Feedback;

/// <summary>
/// An isolated app (own in-memory DB) with a fake clock and a capturing MailService, so the
/// time-based limits and the digest can be tested deterministically.
/// </summary>
public sealed class FeedbackTestHost : IAsyncDisposable
{
    public const string Recipient = "feedback@test.com";

    // 10:00 in Berlin (CEST, UTC+2): before the 17:00 digest cutoff.
    public static readonly DateTimeOffset Start = new(2026, 9, 27, 8, 0, 0, TimeSpan.Zero);

    private readonly FinderApiFactory _baseFactory = new();

    public FakeTimeProvider Clock { get; } = new(Start);
    public WebApplicationFactory<Program> Factory { get; }
    public CapturingMailService Mail { get; }

    public FeedbackTestHost(string recipient = Recipient, MailService? mailService = null)
    {
        Mail = new CapturingMailService();
        var mail = mailService ?? Mail;
        Factory = _baseFactory.WithWebHostBuilder(b => b.ConfigureServices(services =>
        {
            services.Replace<MailService>(mail);
            services.Replace<TimeProvider>(Clock);
            services.Configure<FeedbackOptions>(o => o.RecipientEmail = recipient);
        }));
    }

    public Task<Business.Auth.Entities.Person> SeedUser() => _baseFactory.SeedUser();

    public Task SeedLoginToken(Guid userId, string token, string code) => _baseFactory.SeedLoginToken(userId, token, code);

    public HttpClient Client(Guid userId)
    {
        var client = Factory.CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, userId.ToString());
        return client;
    }

    public static Task<HttpResponseMessage> Submit(HttpClient client, string comment = "Something broke", string type = "Bug", string page = "/polls") =>
        client.PostAsJsonAsync("/api/feedback", new { type, comment, page });

    public async Task<T> WithScope<T>(Func<IServiceProvider, Task<T>> action)
    {
        using var scope = Factory.Services.CreateScope();
        return await action(scope.ServiceProvider);
    }

    public Task WithScope(Func<IServiceProvider, Task> action) => WithScope(async sp =>
    {
        await action(sp);
        return 0;
    });

    public Task<T> WithDb<T>(Func<AppDbContext, Task<T>> action) =>
        WithScope(sp => action(sp.GetRequiredService<AppDbContext>()));

    public async ValueTask DisposeAsync()
    {
        await Factory.DisposeAsync();
        await _baseFactory.DisposeAsync();
    }
}

internal static class ServiceCollectionTestExtensions
{
    public static void Replace<T>(this IServiceCollection services, T instance) where T : class
    {
        foreach (var descriptor in services.Where(d => d.ServiceType == typeof(T)).ToList())
        {
            services.Remove(descriptor);
        }

        services.AddSingleton(instance);
    }
}
