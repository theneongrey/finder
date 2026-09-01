using Finder.Business.Permission.Services;

namespace Finder.Business.Permission.Setup;

public static class SetupExtensions
{
    public static IServiceCollection AddPermissionServices(this IServiceCollection services)
    {
        services.AddScoped<PermissionService>();
        services.AddScoped<PermissionMailService>();

        return services;
    }
}