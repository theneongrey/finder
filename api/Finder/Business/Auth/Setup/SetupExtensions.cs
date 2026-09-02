using System.Threading.RateLimiting;
using Finder.Business.Auth.Services;
using Finder.Business.Shared.Services;

namespace Finder.Business.Auth.Setup;

public static class SetupExtensions
{
    public static IServiceCollection AddAuthServices(this IServiceCollection services, ConfigurationManager configuration, bool isDevelopment)
    {
        services.Configure<LoginOptions>(configuration.GetSection("Login"));

        services.AddScoped<LoginService>();
        services.AddScoped<LoginMailService>();
        services.AddScoped<SeedingService>();

        services.AddAuthorization();
        services.AddAuthentication().AddCookie(o =>
        {
            o.Cookie.Name = "login";
            o.ExpireTimeSpan = TimeSpan.FromDays(30);
            o.SlidingExpiration = true;
            o.Events.OnRedirectToAccessDenied =
                o.Events.OnRedirectToLogin = c =>
                {
                    c.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.FromResult<object?>(null);
                };
        });

        services.AddRateLimiter(options =>
        {
            options.AddPolicy("auth", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = isDevelopment ? 1000 : 5,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        });

        return services;
    }
}