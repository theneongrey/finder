using System.Net;
using System.Text;
using System.Threading.RateLimiting;
using Finder.Business.Preview.Services;
using Finder.Business.Preview.Services.PreviewHelper;

namespace Finder.Business.Preview.Setup;

public static class SetupExtensions
{
    private const int MaxPreviewResponseBytes = 5 * 1024 * 1024;

    // Keep in step with a current desktop Chrome; bot filters flag outdated or truncated user agents.
    private const string BrowserUserAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";

    public static IServiceCollection AddPreviewServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Legacy pages still declare charsets like windows-1252, which .NET Core only knows via this provider.
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

        services.Configure<PreviewOptions>(configuration.GetSection(PreviewOptions.SectionName));
        services.AddMemoryCache();

        services.AddSingleton<PlaywrightBrowserProvider>();
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
                    partitionKey: Shared.Setup.SetupExtensions.ClientIpPartitionKey(httpContext),
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        });

        services.AddHttpClient(HtmlGrabberHttpClientService.ClientName, client =>
            {
                // The header set of a regular browser navigation; requests with only a user agent stand out.
                var headers = client.DefaultRequestHeaders;
                headers.TryAddWithoutValidation("User-Agent", BrowserUserAgent);
                headers.TryAddWithoutValidation("Accept",
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8");
                headers.TryAddWithoutValidation("Upgrade-Insecure-Requests", "1");
                headers.TryAddWithoutValidation("Sec-Fetch-Dest", "document");
                headers.TryAddWithoutValidation("Sec-Fetch-Mode", "navigate");
                headers.TryAddWithoutValidation("Sec-Fetch-Site", "none");
                headers.TryAddWithoutValidation("Sec-Fetch-User", "?1");
                client.Timeout = TimeSpan.FromSeconds(5);
                client.MaxResponseContentBufferSize = MaxPreviewResponseBytes;
            })
            // SSRF guard: every connection (including redirect targets) must go to a public address.
            .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
            {
                ConnectCallback = OutboundUrlGuard.ConnectToPublicAddressAsync,
                MaxAutomaticRedirections = 5,
                // Sends Accept-Encoding and transparently decompresses — smaller, faster, and browser-like.
                AutomaticDecompression = DecompressionMethods.All
            });

        return services;
    }
}