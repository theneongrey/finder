using Microsoft.AspNetCore.HttpOverrides;

namespace Finder.Business.Shared.Setup;

public static class SetupExtensions
{
    /// <summary>
    /// The API runs behind a TLS-terminating reverse proxy. Without honouring X-Forwarded-For/-Proto,
    /// every request looks like it comes from the proxy over plain HTTP: IP-based rate limits become
    /// global and cookies are issued without the Secure flag.
    /// </summary>
    public static IServiceCollection AddProxyForwarding(this IServiceCollection services, IConfiguration configuration)
    {
        var proxyOptions = configuration.GetSection("Proxy").Get<ProxyOptions>() ?? new ProxyOptions();

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            // Only the entry appended by our own proxy is trusted; anything a client sent before it is ignored.
            options.ForwardLimit = 1;
            options.KnownNetworks.Clear();
            options.KnownProxies.Clear();
            foreach (var network in proxyOptions.KnownNetworks)
            {
                options.KnownNetworks.Add(Microsoft.AspNetCore.HttpOverrides.IPNetwork.Parse(network));
            }
        });

        services.AddHsts(options =>
        {
            options.MaxAge = TimeSpan.FromDays(180);
        });

        return services;
    }

    /// <summary>Rate-limit partition key: the real client IP (after forwarded headers are applied).</summary>
    public static string ClientIpPartitionKey(HttpContext httpContext) =>
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}
