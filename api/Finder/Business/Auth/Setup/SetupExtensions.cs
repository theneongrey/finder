using Finder.Business.Auth.Services;

namespace Finder.Business.Auth.Setup;

public static class SetupExtensions
{
    public static IServiceCollection AddAuthServices(this IServiceCollection services, ConfigurationManager configuration)
    {
        services.Configure<LoginOptions>(configuration.GetSection("Login"));
        
        services.AddScoped<LoginService>();
        services.AddScoped<MailService>();
        
        services.AddAuthorization();
        services.AddAuthentication().AddCookie(o =>
        {
            o.Cookie.Name = "login";
            o.Events.OnRedirectToAccessDenied =
                o.Events.OnRedirectToLogin = c =>
                {
                    c.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.FromResult<object?>(null);
                };
        });
        
        return services;
    }
}