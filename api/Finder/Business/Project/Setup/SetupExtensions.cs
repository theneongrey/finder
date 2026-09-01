using Finder.Business.Project.Services;

namespace Finder.Business.Project.Setup;

public static class SetupExtensions
{
    public static IServiceCollection AddProjectServices(this IServiceCollection services)
    {
        services.AddScoped<ProjectService>();
        services.AddScoped<VoteService>();
        services.AddScoped<ProjectMailService>();
        services.AddSingleton<PollUpdateNotificationQueue>();

        return services;
    }
}