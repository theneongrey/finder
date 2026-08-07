using System.Data.Common;
using System.Threading.RateLimiting;
using Finder.Business.Auth.Entities;
using Finder.Business.Permission.Entities;
using Finder.Business.Project.Entities;
using Finder.Business.Shared;
using Finder.Database;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Builder;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.RateLimiting;


namespace Finder.Tests.Infrastructure;

public class FinderApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            var dbContextDescriptor =
                services.SingleOrDefault(d => d.ServiceType == typeof(IDbContextOptionsConfiguration<AppDbContext>));
            services.Remove(dbContextDescriptor);

            var dbConnectionDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbConnection));
            services.Remove(dbConnectionDescriptor);

            services.AddSingleton<DbConnection>(_ =>
            {
                var connection = new SqliteConnection($"DataSource={_dbName};Mode=Memory;Cache=Shared");
                connection.Open();
                return connection;
            });

            services.AddDbContext<AppDbContext>((container, options) =>
            {
                var connection = container.GetRequiredService<DbConnection>();
                options.UseSqlite(connection);
                options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
            });

            services.AddAuthentication(TestAuthHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });

            // Disable rate limiting in tests
            var rateLimiterConfigDescriptors = services
                .Where(d => d.ServiceType == typeof(IConfigureOptions<RateLimiterOptions>))
                .ToList();
            
            foreach (var d in rateLimiterConfigDescriptors)
            {
                services.Remove(d);
            }

            services.AddRateLimiter(options =>
            {
                options.AddPolicy("auth", _ => RateLimitPartition.GetNoLimiter("auth"));
                options.AddPolicy("preview", _ => RateLimitPartition.GetNoLimiter("preview"));
            });

            services.PostConfigure<AuthenticationOptions>(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
                options.DefaultForbidScheme = TestAuthHandler.SchemeName;
                options.DefaultScheme = TestAuthHandler.SchemeName;
                options.DefaultSignInScheme = Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultSignOutScheme = Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationDefaults.AuthenticationScheme;
            });
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        return host;
    }

    public HttpClient CreateAuthenticatedClient(Guid userId)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, userId.ToString());
        return client;
    }

    public async Task<Person> SeedUser(string? email = null)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var person = new Person
        {
            Id = Guid.NewGuid(),
            Email = email ?? $"{Guid.NewGuid()}@test.com",
            Role = Role.Free
        };
        db.Persons.Add(person);
        await db.SaveChangesAsync();
        return person;
    }

    public async Task<Project> SeedProject(Guid creatorId, string name = "Test Project",
        string description = "Test Description", bool isStandalone = false)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var creator = await db.Persons.FindAsync(creatorId)
                      ?? throw new InvalidOperationException($"User {creatorId} not found. Call SeedUser first.");
        var project = new Project
        {
            Id = SlugHelper.GenerateId(),
            Name = name,
            Description = description,
            Creator = creator,
            IsStandalone = isStandalone,
            VisibilityType = VisibilityType.VisibleForSelectedOnly
        };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        return project;
    }

    public async Task<Poll> SeedPoll(string projectId, string name = "Test Poll",
        OptionType optionType = OptionType.YesNo, string description = "")
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var project = await db.Projects.FindAsync(projectId)
                      ?? throw new InvalidOperationException($"Project {projectId} not found. Call SeedProject first.");
        var poll = new Poll
        {
            Id = SlugHelper.GenerateId(),
            Name = name,
            Description = description,
            OptionType = optionType,
            Project = project,
        };
        db.Polls.Add(poll);
        await db.SaveChangesAsync();
        return poll;
    }

    public async Task<Option> SeedOption(string pollId, string text = "Test Option", string description = "",
        string? url = null)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var poll = await db.Polls.FindAsync(pollId)
                    ?? throw new InvalidOperationException($"Poll {pollId} not found. Call SeedPoll first.");
        var option = new Option
        {
            Id = SlugHelper.GenerateId(),
            Text = text,
            Description = description,
            Poll = poll
        };
        if (url is not null)
        {
            option.Meta = new OptionMeta
            {
                Id = option.Id,
                Url = url,
                Title = "",
                Description = "",
                ImageUrl = "",
                SiteName = "",
                Option = option
            };
        }
        db.Options.Add(option);
        await db.SaveChangesAsync();
        return option;
    }

    public async Task SeedPermission(string projectId, Guid userId, PermissionType permissionType)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var project = await db.Projects.Include(p => p.Permissions).FirstOrDefaultAsync(p => p.Id == projectId)
                      ?? throw new InvalidOperationException($"Project {projectId} not found.");
        var user = await db.Persons.FindAsync(userId)
                   ?? throw new InvalidOperationException($"User {userId} not found.");
        db.Permissions.Add(new Permission
        {
            Project = project,
            Person = user,
            PermissionType = permissionType
        });
        await db.SaveChangesAsync();
    }

    public async Task<LoginToken> SeedLoginToken(Guid userId, string token, string code)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var person = await db.Persons.FindAsync(userId)
                     ?? throw new InvalidOperationException($"User {userId} not found.");
        var loginToken = new LoginToken
        {
            Id = Guid.NewGuid(),
            Person = person,
            Token = token.ToLower(),
            Code = code,
            Retries = 0
        };
        db.LoginTokens.Add(loginToken);
        await db.SaveChangesAsync();
        return loginToken;
    }
}