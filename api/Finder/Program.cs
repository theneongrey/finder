using System.Text.Json;
using System.Text.Json.Serialization;
using Npgsql;
using System.Threading.RateLimiting;
using DnsClient;
using Microsoft.AspNetCore.DataProtection;
using Scalar.AspNetCore;
using Finder.Business.Auth.Api;
using Finder.Business.Auth.Setup;
using Finder.Business.Permission.Api;
using Finder.Business.Permission.Setup;
using Finder.Business.Preview.Api;
using Finder.Business.Preview.Setup;
using Finder.Business.Project.Api;
using Finder.Business.Project.Setup;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Business.User.Api;
using Finder.Business.User.Setup;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddCors();

builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton(sp =>
    new NpgsqlDataSourceBuilder(sp.GetRequiredService<IConfiguration>().GetConnectionString("Database"))
        .EnableDynamicJson()
        .Build());

builder.Services.AddDbContext<AppDbContext>((sp, opt) =>
    opt.UseNpgsql(sp.GetRequiredService<NpgsqlDataSource>()));

builder.Services.AddDataProtection()
    .PersistKeysToDbContext<AppDbContext>();

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.Configure<AppOptions>(builder.Configuration.GetSection("App"));
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));
builder.Services.Configure<NotificationOptions>(builder.Configuration.GetSection("Notifications"));
builder.Services.AddSingleton<ILookupClient, LookupClient>();
builder.Services.AddSingleton<EmailValidationService>();
builder.Services.AddSingleton<MailTemplateService>();
builder.Services.AddSingleton<MailService>();
builder.Services.Configure<I18nOptions>(builder.Configuration.GetSection("I18n"));
builder.Services.AddSingleton<LanguageService>();
builder.Services.AddHttpClient("EmailValidation", client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<NotificationMailGuard>();

builder.Services.AddAuthServices(builder.Configuration, builder.Environment.IsDevelopment());
builder.Services.AddProjectServices();
builder.Services.AddPermissionServices();
builder.Services.AddUserServices();
builder.Services.AddPreviewServices();

var app = builder.Build();

if (!app.Environment.IsEnvironment("Testing"))
{
    using var scope = app.Services.GetRequiredService<IServiceScopeFactory>().CreateScope();
    var db = scope.ServiceProvider.GetService<AppDbContext>()!;
    db.Database.Migrate();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.WithAuthApi();
app.WithProjectApi();
app.WithPermissionApi();
app.WithUserApi();
app.WithUrlPreviewApi();

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
    app.MapScalarApiReference();
}

//app.UseHttpsRedirection();

app.Run();

public partial class Program { }