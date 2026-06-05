using Finder.Business.Auth.Entities;
using Finder.Business.Project.Entities;
using Finder.Database;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Finder.Tests.Infrastructure;

public class FinderApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration(config =>
        {
            config.AddInMemoryCollection([new KeyValuePair<string, string?>("TestDbName", _dbName)]);
        });

        builder.ConfigureServices(services =>
        {
            services.AddAuthentication(TestAuthHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });

            services.PostConfigure<AuthenticationOptions>(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
                options.DefaultForbidScheme = TestAuthHandler.SchemeName;
                options.DefaultScheme = TestAuthHandler.SchemeName;
            });
        });
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

    public async Task<Project> SeedProject(Guid creatorId, string name = "Test Project", string description = "Test Description")
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var creator = await db.Persons.FindAsync(creatorId)
            ?? throw new InvalidOperationException($"User {creatorId} not found. Call SeedUser first.");
        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            Creator = creator,
            VisibilityType = VisibilityType.SelectedOnly
        };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        return project;
    }
}
