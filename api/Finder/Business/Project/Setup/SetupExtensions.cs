using Finder.Business.Project.RealTime;
using Finder.Business.Project.Services;

namespace Finder.Business.Project.Setup;

public static class SetupExtensions
{
    public static IServiceCollection AddProjectServices(this IServiceCollection services)
    {
        services.AddScoped<ProjectService>();
        services.AddScoped<PollService>();
        services.AddScoped<OptionService>();
        services.AddScoped<CommentService>();
        services.AddScoped<VoteService>();
        services.AddScoped<ProjectMailService>();
        services.AddScoped<ProjectNotificationService>();
        services.AddScoped<PollChangesBuilder>();
        services.AddSingleton<PollUpdateNotificationQueue>();
        services.AddSingleton<PollPresenceRegistry>();
        services.AddSingleton<IPollChangeNotifier, PollChangeNotifier>();

        return services;
    }
}