using Finder.Business.Permission.Api.Requests;
using Finder.Business.Permission.Api.Responses;
using Finder.Business.Permission.Services;
using Finder.Business.Project.Api.Responses;
using Finder.Business.Shared.Services;
using Microsoft.AspNetCore.Mvc;

namespace Finder.Business.Permission.Api;

public static class PermissionApi
{
    public static void WithPermissionApi(this WebApplication app)
    {
        // Get persons who have been invited but never logged in
        app.MapGet("/api/permission/invited",
                async (PermissionService permissionService) =>
                {
                    var result = await permissionService.GetInvitedPersons();
                    if (!result.IsSuccess)
                    {
                        return Results.Forbid();
                    }

                    return Results.Ok(result.Payload!.Select(p => p.ToInvitedPersonResponse()));
                })
            .RequireAuthorization();

        // Get frequent sharing contacts for a project (excluding existing members)
        app.MapGet("/api/permission/contacts/{projectSlug}",
                async (string projectSlug, PermissionService permissionService) =>
                {
                    var contacts = await permissionService.GetSharingContacts(projectSlug);
                    return Results.Ok(contacts);
                })
            .RequireAuthorization();

        // Update project visibility
        app.MapPut("/api/permission/type/{projectSlug}",
                async (string projectSlug, [FromBody] UpdatePermissionTypeRequest typeRequest,
                    PermissionService permissionService) =>
                {
                    await permissionService.UpdateVisibilityType(projectSlug, typeRequest.Type);
                    return Results.Ok();
                })
            .RequireAuthorization();

        // Remove user permission
        app.MapDelete("/api/permission/{projectSlug}/{email}",
                async (string projectSlug, string email, PermissionService permissionService, UserService userService) =>
                {
                    var result = await permissionService.RemovePermissionForUser(email, projectSlug);
                    if (!result.IsSuccess)
                    {
                        return result.Code switch
                        {
                            403 => Results.Forbid(),
                            _ => Results.NotFound()
                        };
                    }

                    var project = result.Payload!;

                    var sharedWith = project.Permissions
                        .Where(p => p.PersonKey != project.Creator.Id)
                        .Select(p => p.ToProjectSharedWith())
                        .Prepend(new ProjectSharedWith
                        {
                            Name = project.Creator.Name ?? project.Creator.Email,
                            Email = project.Creator.Email,
                            Role = ProjectRole.Creator
                        });

                    return Results.Ok(sharedWith);
                })
            .RequireAuthorization();

        // Update user permission
        app.MapPut("/api/permission/{projectSlug}",
                async (string projectSlug, [FromBody] UpdatePermissionRequest request, PermissionService permissionService,
                    UserService userService) =>
                {
                    var result = await permissionService.AddOrUpdatePermissionForUser(request.Email, projectSlug,
                        request.PermissionType);
                    if (result.IsSuccess)
                    {
                        var project = result.Payload!;

                        var sharedWith = project.Permissions
                            .Where(p => p.PersonKey != project.Creator.Id)
                            .Select(p => p.ToProjectSharedWith())
                            .Prepend(new ProjectSharedWith
                            {
                                Name = project.Creator.Name ?? project.Creator.Email,
                                Email = project.Creator.Email,
                                Role = ProjectRole.Creator
                            });

                        return Results.Ok(sharedWith);
                    }

                    return result.Code switch
                    {
                        404 => Results.NotFound(),
                        403 => Results.Forbid(),
                        _ => Results.BadRequest()
                    };
                })
            .RequireAuthorization();
    }
}
