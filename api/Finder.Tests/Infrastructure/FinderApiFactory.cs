using System.Data.Common;
using System.Net;
using System.Threading.RateLimiting;
using DnsClient;
using DnsClient.Protocol;
using Finder.Business.Auth.Entities;
using Finder.Business.Permission.Entities;
using Finder.Business.Preview.Services.PreviewHelper;
using Finder.Business.Project.Entities;
using Finder.Business.Shared;
using Finder.Business.User.Entities;
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
using Microsoft.Extensions.Configuration;
using NSubstitute;


namespace Finder.Tests.Infrastructure;

public class FinderApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddUserSecrets<Program>();      // main project secrets (e.g. ClaudeApiKey)
            config.AddUserSecrets<FinderApiFactory>(); // test-specific overrides
        });
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

            ConfigureEmailValidationDoubles(services);
        });
    }

    // The invalid-domain email used by tests to force email validation to fail (no MX record).
    public const string NoMxEmailDomain = "blocked-no-mx.test";

    // EmailValidationService does a real DNS MX lookup and fetches a disposable-domain
    // blocklist over HTTP. Replace both dependencies with deterministic doubles so the API
    // suite never touches the network: any domain resolves with an MX record (valid) except
    // the NoMxEmailDomain sentinel, and the blocklist fetch returns an empty list.
    private static void ConfigureEmailValidationDoubles(IServiceCollection services)
    {
        var lookupClient = Substitute.For<ILookupClient>();
        lookupClient
            .QueryAsync(Arg.Any<string>(), Arg.Any<QueryType>(), Arg.Any<QueryClass>(), Arg.Any<CancellationToken>())
            .Returns(_ => Task.FromResult(MakeDnsResponse(withMx: true)));
        lookupClient
            .QueryAsync(NoMxEmailDomain, Arg.Any<QueryType>(), Arg.Any<QueryClass>(), Arg.Any<CancellationToken>())
            .Returns(_ => Task.FromResult(MakeDnsResponse(withMx: false)));

        // ILookupClient is consumed by the singleton EmailValidationService, so it must also
        // be a singleton — Replace() registers scoped, which would fail scope validation.
        var lookupDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(ILookupClient));
        if (lookupDescriptor != null)
        {
            services.Remove(lookupDescriptor);
        }
        services.AddSingleton<ILookupClient>(lookupClient);

        services.AddHttpClient("EmailValidation")
            .ConfigurePrimaryHttpMessageHandler(() => new EmptyBlocklistHandler());
    }

    private static IDnsQueryResponse MakeDnsResponse(bool withMx)
    {
        var answers = new List<DnsResourceRecord>();
        if (withMx)
        {
            var info = new ResourceRecordInfo("example.com", ResourceRecordType.MX, QueryClass.IN, 300, 0);
            answers.Add(new MxRecord(info, 10, DnsString.Parse("mail.example.com.")));
        }

        var response = Substitute.For<IDnsQueryResponse>();
        response.Answers.Returns(answers);
        return response;
    }

    private sealed class EmptyBlocklistHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
            => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(string.Empty)
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

    public async Task<Person> SeedUser(string? email = null, Role role = Role.Free)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var person = new Person
        {
            Id = Guid.NewGuid(),
            Email = email ?? $"{Guid.NewGuid()}@test.com",
            Role = role
        };
        db.Persons.Add(person);
        await db.SaveChangesAsync();
        return person;
    }

    public async Task<Project> SeedProject(Guid creatorId, string name = "Test Project",
        string description = "Test Description", bool isStandalone = false,
        VisibilityType visibilityType = VisibilityType.VisibleForSelectedOnly)
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
            VisibilityType = visibilityType
        };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        return project;
    }

    public async Task<Poll> SeedPoll(string projectId, string name = "Test Poll",
        OptionType optionType = OptionType.YesNo, string description = "", DateTime? closeDate = null)
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
            CloseDate = closeDate.HasValue ? DateTime.SpecifyKind(closeDate.Value, DateTimeKind.Utc) : null
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
        var poll = await db.Polls
                       .Include(p => p.Project).ThenInclude(pr => pr.Creator)
                       .FirstOrDefaultAsync(p => p.Id == pollId)
                    ?? throw new InvalidOperationException($"Poll {pollId} not found. Call SeedPoll first.");
        var option = new Option
        {
            Id = SlugHelper.GenerateId(),
            Text = text,
            Description = description,
            Poll = poll,
            Creator = poll.Project.Creator
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

    public async Task<Vote> SeedVote(string optionId, Guid userId, string choice = "yes")
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var option = await db.Options.FindAsync(optionId)
                     ?? throw new InvalidOperationException($"Option {optionId} not found. Call SeedOption first.");
        var user = await db.Persons.FindAsync(userId)
                   ?? throw new InvalidOperationException($"User {userId} not found.");
        var vote = new Vote
        {
            Id = Guid.NewGuid(),
            Choice = choice,
            Option = option,
            Person = user
        };
        db.Votes.Add(vote);
        await db.SaveChangesAsync();
        return vote;
    }

    /// <summary>
    /// Rewrites the Edited timestamp of a poll and all its options/comments/votes directly
    /// (bypassing the SaveChanges auto-stamp) so delta tests can establish a stable baseline
    /// in the past before performing a mutation.
    /// </summary>
    public async Task BackdatePollActivityAsync(string pollId, DateTime edited)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Polls.Where(p => p.Id == pollId)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.Edited, edited));
        await db.Options.Where(o => o.Poll.Id == pollId)
            .ExecuteUpdateAsync(s => s.SetProperty(o => o.Edited, edited));
        await db.Comments.Where(c => c.Poll.Id == pollId)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.Edited, edited));
        await db.Votes.Where(v => v.Option.Poll.Id == pollId)
            .ExecuteUpdateAsync(s => s.SetProperty(v => v.Edited, edited));
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

    public WebApplicationFactory<Program> WithMockedHtmlGrabbers(
        IHtmlGrabberHttpClientService httpGrabber,
        IHtmlGrabberPlaywrightService playwrightGrabber) =>
        WithWebHostBuilder(b => b.ConfigureServices(services =>
        {
            Replace(services, httpGrabber);
            Replace(services, playwrightGrabber);
        }));

    private static void Replace<T>(IServiceCollection services, T instance) where T : class
    {
        var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(T));
        if (descriptor != null)
        {
            services.Remove(descriptor);
        }

        services.AddScoped<T>(_ => instance);
    }

    public async Task SeedPersonNotificationSettings(Guid userId)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var definitions = await db.NotificationSettings.ToListAsync();
        foreach (var def in definitions)
        {
            db.PersonNotificationSettings.Add(new PersonNotificationSetting
            {
                PersonId = userId,
                NotificationSettingId = def.Id,
                Value = def.DefaultValue,
            });
        }
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