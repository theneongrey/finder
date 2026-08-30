using Finder.Business.User.Services;

namespace Finder.Business.User.Setup;

public static class SetupExtensions
{
    public static IServiceCollection AddUserServices(this IServiceCollection services)
    {
        services.AddScoped<ProfileService>();
        services.AddScoped<NotificationSettingsService>();

        return services;
    }
}
