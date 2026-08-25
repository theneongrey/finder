using System.Threading.RateLimiting;
using Finder.Business.Preview.Services;
using Finder.Business.Preview.Services.PreviewHelper;

namespace Finder.Business.Preview.Setup;

public static class SetupExtensions
{
    public static IServiceCollection AddPreviewServices(this IServiceCollection services)
    {
        services.AddScoped<IHtmlGrabberPlaywrightService, HtmlGrabberPlaywrightService>();
        services.AddScoped<IHtmlGrabberHttpClientService, HtmlGrabberHttpClientService>();
        services.AddScoped<PreviewGrabberMetaService>();
        services.AddScoped<PreviewGrabberClaudeService>();
        services.AddScoped<PreviewGrabberQueryService>();
        services.AddScoped<PreviewService>();
        services.AddScoped<PreviewImageOnlyFinder>();
        services.AddScoped<IImageSizeService, ImageSizeService>();
        services.AddScoped<IPreviewImageCandidateService, PreviewImageCandidateService>();
        
        services.AddRateLimiter(options =>
        {
            options.AddPolicy("preview", httpContext =>
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
        
        services.AddHttpClient("PreviewClient", client => {
            client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            client.Timeout = TimeSpan.FromSeconds(5);
        });
        
        return services;
    }
}