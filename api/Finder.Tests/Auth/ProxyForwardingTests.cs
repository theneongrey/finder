using System.Net;
using System.Net.Http.Json;
using System.Threading.RateLimiting;
using Finder.Business.Shared.Setup;
using Finder.Tests.Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Options;
using Xunit;

namespace Finder.Tests.Auth;

/// <summary>
/// The API runs behind a TLS-terminating reverse proxy. These tests pin down that the forwarded
/// client IP and scheme are honoured, so IP rate limits are per client and cookies are Secure.
/// </summary>
public class ProxyForwardingTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public ProxyForwardingTests(FinderApiFactory factory) => _factory = factory;

    [Fact]
    public async Task AuthRateLimit_IsPartitionedByForwardedClientIp()
    {
        using var client = CreateClientWithStrictAuthLimit();

        var firstA = await RequestLoginMail(client, "203.0.113.1");
        var secondA = await RequestLoginMail(client, "203.0.113.1");
        var firstB = await RequestLoginMail(client, "203.0.113.2");

        Assert.Equal(HttpStatusCode.OK, firstA.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, secondA.StatusCode);
        // A different client behind the same proxy has its own budget.
        Assert.Equal(HttpStatusCode.OK, firstB.StatusCode);
    }

    [Fact]
    public async Task ForwardedFor_OnlyTrustsTheEntryAppendedByTheProxy()
    {
        using var client = CreateClientWithStrictAuthLimit();

        // A client can prepend arbitrary values; only the last hop (added by our proxy) counts.
        var first = await RequestLoginMail(client, "198.51.100.7, 203.0.113.9");
        var spoofed = await RequestLoginMail(client, "198.51.100.8, 203.0.113.9");

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, spoofed.StatusCode);
    }

    [Fact]
    public async Task LoginCookie_IsSecureHttpOnlyAndLax()
    {
        var user = await _factory.SeedUser();
        await _factory.SeedLoginToken(user.Id, "proxy-cookie-token", "123456");
        using var client = _factory.CreateClient();

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/tokenLogin")
        {
            Content = JsonContent.Create(new { loginToken = "proxy-cookie-token" })
        };
        request.Headers.Add("X-Forwarded-Proto", "https");
        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cookie = response.Headers.GetValues("Set-Cookie").Single(c => c.StartsWith("login="));
        Assert.Contains("secure", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("httponly", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=lax", cookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Hsts_IsSentForForwardedHttpsRequests()
    {
        using var client = _factory.CreateClient();

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/who");
        // HSTS is suppressed for localhost, so use a real-looking host.
        request.Headers.Host = "votean.example";
        request.Headers.Add("X-Forwarded-Proto", "https");
        var response = await client.SendAsync(request);

        Assert.True(response.Headers.Contains("Strict-Transport-Security"));
    }

    private HttpClient CreateClientWithStrictAuthLimit() =>
        _factory.WithWebHostBuilder(b => b.ConfigureTestServices(services =>
        {
            foreach (var d in services.Where(d => d.ServiceType == typeof(IConfigureOptions<RateLimiterOptions>)).ToList())
            {
                services.Remove(d);
            }

            services.AddRateLimiter(options =>
            {
                options.AddPolicy("auth", httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        SetupExtensions.ClientIpPartitionKey(httpContext),
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 1,
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0
                        }));
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            });
        })).CreateClient();

    private static async Task<HttpResponseMessage> RequestLoginMail(HttpClient client, string forwardedFor)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/requestLoginMail")
        {
            Content = JsonContent.Create(new { email = $"{Guid.NewGuid()}@test.com", redirectUrl = (string?)null })
        };
        request.Headers.Add("X-Forwarded-For", forwardedFor);
        return await client.SendAsync(request);
    }
}
