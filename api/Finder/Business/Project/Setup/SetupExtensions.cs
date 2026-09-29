using Finder.Business.Project.RealTime;
using Finder.Business.Project.Services;

namespace Finder.Business.Project.Setup;

public static class SetupExtensions
{
    public static IServiceCollection AddProjectServices(this IServiceCollection services, bool runBackgroundDispatchers)
    {
        services.AddSignalR();
        services.AddScoped<ProjectService>();
        services.AddScoped<PollService>();
        services.AddScoped<OptionService>();
        services.AddScoped<CommentService>();
        services.AddScoped<VoteService>();
        services.AddScoped<ProjectMailService>();
        services.AddScoped<ProjectNotificationService>();
        services.AddScoped<PollChangesBuilder>();
        services.AddScoped<PollUpdateNotificationQueue>();
        services.AddSingleton<PollUpdateDispatcher>();
        if (runBackgroundDispatchers)
        {
            services.AddHostedService(sp => sp.GetRequiredService<PollUpdateDispatcher>());
        }
        services.AddSingleton<PollPresenceRegistry>();
        services.AddSingleton<IPollChangeNotifier, PollChangeNotifier>();

        return services;
    }

    public static WebApplication MapProjectHubs(this WebApplication app)
    {
        app.MapHub<PollHub>("/hub/poll").RequireAuthorization();

        return app;
    }
}