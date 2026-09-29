using System.Net.Http.Json;
using Finder.Business.Permission.Entities;
using Finder.Database;
using Finder.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Finder.Tests.Projects;

public class DataIntegrityTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public DataIntegrityTests(FinderApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Person_EmailMustBeUnique()
    {
        var email = $"{Guid.NewGuid()}@test.com";
        await _factory.SeedUser(email);

        await Assert.ThrowsAsync<DbUpdateException>(() => _factory.SeedUser(email));
    }

    [Fact]
    public async Task Vote_OnePerPersonAndOption()
    {
        var owner = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        var poll = await _factory.SeedPoll(project.Id);
        var option = await _factory.SeedOption(poll.Id);
        await _factory.SeedVote(option.Id, owner.Id);

        await Assert.ThrowsAsync<DbUpdateException>(() => _factory.SeedVote(option.Id, owner.Id, "no"));
    }

    [Fact]
    public async Task Vote_RepeatedRequests_UpdateTheSingleVote()
    {
        var owner = await _factory.SeedUser();
        var voter = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        await _factory.SeedPermission(project.Id, voter.Id, PermissionType.Voter);
        var poll = await _factory.SeedPoll(project.Id);
        var option = await _factory.SeedOption(poll.Id);
        using var client = _factory.CreateAuthenticatedClient(voter.Id);

        var first = await client.PutAsJsonAsync($"/api/project/poll/vote/{option.Id}", new { choice = "yes" });
        var second = await client.PutAsJsonAsync($"/api/project/poll/vote/{option.Id}", new { choice = "no" });

        Assert.True(first.IsSuccessStatusCode);
        Assert.True(second.IsSuccessStatusCode);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var votes = await db.Votes.Where(v => v.Option.Id == option.Id && v.Person.Id == voter.Id).ToListAsync();
        Assert.Equal("no", Assert.Single(votes).Choice);
    }
}
