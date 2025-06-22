using Finder.Business.Permission.Services;

namespace Finder.Business.Permission.Setup;

public static class SetupExtensions
{
    public static IServiceCollection AddPermissionServices(this IServiceCollection services, ConfigurationManager configuration)
    {
        services.Configure<ShareMailOptions>(configuration.GetSection("ShareMail"));
        
        services.AddScoped<PermissionService>();
        services.AddScoped<MailService>();
        
        return services;
    }
}