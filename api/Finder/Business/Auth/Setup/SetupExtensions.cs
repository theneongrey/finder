using System.Security.Claims;
using System.Threading.RateLimiting;
using Finder.Business.Auth.Services;
using Finder.Business.Shared.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace Finder.Business.Auth.Setup;

public static class SetupExtensions
{
    public static IServiceCollection AddAuthServices(this IServiceCollection services, ConfigurationManager configuration, bool isDevelopment)
    {
        services.Configure<LoginOptions>(configuration.GetSection("Login"));

        services.AddScoped<LoginService>();
        services.AddScoped<LoginMailService>();
        services.AddScoped<SeedingService>();
        services.AddSingleton<BlockedUserCache>();

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
            // Drops the session of a blocked person on their next request (cookies last 30 days).
            o.Events.OnValidatePrincipal = async context =>
            {
                var id = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!Guid.TryParse(id, out var personId))
                {
                    return;
                }

                var blockedUserCache = context.HttpContext.RequestServices.GetRequiredService<BlockedUserCache>();
                if (await blockedUserCache.IsBlocked(personId))
                {
                    context.RejectPrincipal();
                    await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                }
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