using System.Text.Json;
using System.Text.Json.Serialization;
using Finder.Business.Auth.Api;
using Finder.Business.Auth.Setup;
using Finder.Business.Permission.Api;
using Finder.Business.Permission.Setup;
using Finder.Business.Project.Api;
using Finder.Business.Project.Setup;
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
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Database")));

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.Con228822verters.Add(new JsonStringEnumConverter());
});

builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));
builder.Services.AddScoped<UserService>();

builder.Services.AddAuthServices(builder.Configuration);
builder.Services.AddProjectServices();
builder.Services.AddPermissionServices(builder.Configuration);
builder.Services.AddUserServices();

var app = builder.Build();

using (var scope = app.Services.GetRequiredService<IServiceScopeFactory>().CreateScope())
{
    var db = scope.ServiceProvider.GetService<AppDbContext>()!;
    db.Database.Migrate();
}

app.UseAuthentication();
app.UseAuthorization();
app.WithAuthApi();
app.WithProjectApi();
app.WithPermissionApi();
app.WithUserApi();

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

public partial class Program { }