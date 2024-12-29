using Finder.Business.Auth.Api;
using Finder.Business.Auth.Services;
using Finder.Database;
using Finder.Options;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddHttpContextAccessor();
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Database")));

builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));
builder.Services.Configure<LoginOptions>(builder.Configuration.GetSection("Login"));
builder.Services.AddScoped<LoginService>();
builder.Services.AddScoped<PersonService>();
builder.Services.AddScoped<MailService>();
builder.Services.AddAuthorization();
builder.Services.AddAuthentication().AddCookie(o =>
{
    o.Cookie.Name = "login";
});

var app = builder.Build();

using (var scope = app.Services.GetRequiredService<IServiceScopeFactory>().CreateScope())
{
    scope.ServiceProvider.GetService<AppDbContext>()!.Database.Migrate();
    HttpContext x;
    
}

app.UseAuthentication();
app.UseAuthorization();
app.WithAuthApi();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.Run();