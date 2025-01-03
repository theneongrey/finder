using Finder.Business.Auth.Api;
using Finder.Business.Auth.Services;
using Finder.Business.Project.Api;
using Finder.Business.Project.Services;
using Finder.Business.Shared.Services;
using Finder.Database;
using Finder.Options;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddCors();

builder.Services.AddHttpContextAccessor();
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Database")));

builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));
builder.Services.Configure<LoginOptions>(builder.Configuration.GetSection("Login"));
builder.Services.AddScoped<LoginService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<MailService>();
builder.Services.AddScoped<ProjectService>();
builder.Services.AddAuthorization();
builder.Services.AddAuthentication().AddCookie(o =>
{
    o.Cookie.Name = "login";
    o.Events.OnRedirectToAccessDenied =
        o.Events.OnRedirectToLogin = c =>
        {
            c.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.FromResult<object?>(null);
        };
    
});
builder.Services.AddSpaStaticFiles(configuration => { configuration.RootPath = "App"; });

var app = builder.Build();

using (var scope = app.Services.GetRequiredService<IServiceScopeFactory>().CreateScope())
{
    scope.ServiceProvider.GetService<AppDbContext>()!.Database.Migrate();
}

app.UseAuthentication();
app.UseAuthorization();
app.WithAuthApi();
app.WithProjectApi();
app.UseSpaStaticFiles();
app.UseSpa(_ => { });

if (app.Environment.IsDevelopment())
{
    app.UseCors(policyBuilder => policyBuilder
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials()
        .WithOrigins("http://localhost:4200")
    );
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

//app.UseHttpsRedirection();

app.Run();