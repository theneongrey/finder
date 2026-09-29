using System.Threading.RateLimiting;
using Finder.Business.Feedback.Services;

namespace Finder.Business.Feedback.Setup;

public static class SetupExtensions
{
    public static IServiceCollection AddFeedbackServices(this IServiceCollection services, ConfigurationManager configuration, IHostEnvironment environment)
    {
        services.Configure<FeedbackOptions>(configuration.GetSection("Feedback"));

        services.AddScoped<FeedbackPreferenceService>();
        services.AddScoped<FeedbackService>();
        services.AddScoped<FeedbackLimitService>();
        services.AddScoped<FeedbackDigestService>();

        // Tests drive FeedbackDigestService directly with a fake clock instead.
        if (!environment.IsEnvironment("Testing"))
        {
            services.AddHostedService<FeedbackDigestWorker>();
        }

        services.AddRateLimiter(options =>
        {
            options.AddPolicy("feedback", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        });

        return services;
    }
}
