using System.Net;
using System.Net.Http.Json;
using Finder.Business.Permission.Entities;
using Finder.Business.Project.Entities;
using Finder.Tests.Infrastructure;
using Xunit;

namespace Finder.Tests.Permissions;

public class PermissionApiTests : IClassFixture<FinderApiFactory>
{
    private readonly FinderApiFactory _factory;

    public PermissionApiTests(FinderApiFactory factory) => _factory = factory;

    // --- PUT /api/permission/type/{projectId} ---

    [Fact]
    public async Task UpdateVisibilityType_WhenCreator_ReturnsOk()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync($"/api/permission/type/{project.Id}",
            new { type = (int)VisibilityType.VisibleForEverbody });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task UpdateVisibilityType_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync($"/api/permission/type/{Guid.NewGuid()}",
            new { type = (int)VisibilityType.VisibleForEverbody });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- PUT /api/permission/{projectId} ---

    [Fact]
    public async Task AddPermission_WhenCreator_ReturnsSharedWith()
    {
        var creator = await _factory.SeedUser();
        var target = await _factory.SeedUser();
        var project = await _factory.SeedProject(creator.Id);
        using var client = _factory.CreateAuthenticatedClient(creator.Id);

        var response = await client.PutAsJsonAsync($"/api/permission/{project.Id}",
            new { email = target.Email, permissionType = (int)PermissionType.Voter });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task AddPermission_WhenNotOwner_Returns404()
    {
        var owner = await _factory.SeedUser();
        var other = await _factory.SeedUser();
        var target = await _factory.SeedUser();
        var project = await _factory.SeedProject(owner.Id);
        using var client = _factory.CreateAuthenticatedClient(other.Id);

        var response = await client.PutAsJsonAsync($"/api/permission/{project.Id}",
            new { email = target.Email, permissionType = (int)PermissionType.Voter });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task AddPermission_ForSelf_ReturnsForbid()
    {
        var user = await _factory.SeedUser();
        var project = await _factory.SeedProject(user.Id);
        using var client = _factory.CreateAuthenticatedClient(user.Id);

        var response = await client.PutAsJsonAsync($"/api/permission/{project.Id}",
            new { email = user.Email, permissionType = (int)PermissionType.Voter });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AddPermission_WhenUnauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PutAsJsonAsync($"/api/permission/{Guid.NewGuid()}",
            new { email = "someone@test.com", permissionType = (int)PermissionType.Voter });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
