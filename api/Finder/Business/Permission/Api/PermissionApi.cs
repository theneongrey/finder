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
        app.MapGet("/api/permission/contacts/{projectId:guid}",
                async (Guid projectId, PermissionService permissionService) =>
                {
                    var contacts = await permissionService.GetSharingContacts(projectId);
                    return Results.Ok(contacts);
                })
            .RequireAuthorization();

        // Update project visibility
        app.MapPut("/api/permission/type/{projectId:guid}",
                async (Guid projectId, [FromBody] UpdatePermissionTypeRequest typeRequest,
                    PermissionService permissionService) =>
                {
                    await permissionService.UpdateVisibilityType(projectId, typeRequest.Type);
                    return Results.Ok();
                })
            .RequireAuthorization();

        // Remove user permission
        app.MapDelete("/api/permission/{projectId:guid}/{email}",
                async (Guid projectId, string email, PermissionService permissionService, UserService userService) =>
                {
                    var result = await permissionService.RemovePermissionForUser(email, projectId);
                    if (!result.IsSuccess)
                    {
                        return result.Code switch
                        {
                            403 => Results.Forbid(),
                            _ => Results.NotFound()
                        };
                    }

                    var project = result.Payload!;
                    var userId = userService.GetUserId();

                    var sharedWith = project.Permissions.Where(p => p.PersonKey != userId)
                        .Select(p => p.ToProjectSharedWith());

                    if (userId != project.Creator.Id)
                    {
                        sharedWith = sharedWith.Prepend(
                            new ProjectSharedWith
                            {
                                Name = project.Creator.Name ?? project.Creator.Email,
                                Email = project.Creator.Email,
                                Role = ProjectRole.Creator
                            });
                    }

                    return Results.Ok(sharedWith);
                })
            .RequireAuthorization();

        // Update user permission
        app.MapPut("/api/permission/{projectId:guid}",
                async (Guid projectId, [FromBody] UpdatePermissionRequest request, PermissionService permissionService,
                    UserService userService) =>
                {
                    var result = await permissionService.AddOrUpdatePermissionForUser(request.Email, projectId,
                        request.PermissionType);
                    if (result.IsSuccess)
                    {
                        var project = result.Payload!;
                        var userId = userService.GetUserId();
                        
                        var sharedWith = project.Permissions.Where(p => p.PersonKey != userId)
                            .Select(p => p.ToProjectSharedWith());

                        if (userId != project.Creator.Id)
                        {
                            sharedWith = sharedWith.Prepend(
                                new ProjectSharedWith
                                {
                                    Name = project.Creator.Name ?? project.Creator.Email,
                                    Email = project.Creator.Email,
                                    Role = ProjectRole.Creator
                                });
                        }
                        
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