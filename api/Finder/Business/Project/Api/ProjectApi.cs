using Finder.Business.Project.Api.Requests;
using Finder.Business.Project.Api.Responses;
using Finder.Business.Project.Services;
using Microsoft.AspNetCore.Mvc;

namespace Finder.Business.Project.Api;

public static class ProjectApi
{
    public static void WithProjectApi(this WebApplication app)
    {
        // Get all projects
        app.MapGet("/api/project",
                async (ProjectService projectService) => Results.Ok(
                    (await projectService.GetAll()).Select(p => p.ToProjectOverviewResponse())))
            .RequireAuthorization();

        // Get single project
        app.MapGet("/api/project/{id:guid}", async (Guid id, ProjectService projectService) =>
        {
            var result = await projectService.Get(id);
            return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToProjectResponse());
        }).RequireAuthorization();

        // Add project
        app.MapPost("/api/project",
                async ([FromBody] ProjectRequest request, ProjectService projectService) =>
                {
                    var result = await projectService.Create(request.Name);
                    return !result.IsSuccess
                        ? Results.BadRequest()
                        : Results.Ok(result.Payload!.ToProjectOverviewResponse());
                })
            .RequireAuthorization();

        // Update project
        app.MapPut("/api/project/{id:guid}",
                async (Guid id, [FromBody] ProjectRequest request, ProjectService projectService) =>
                {
                    var result = await projectService.Update(id, request.Name);
                    return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToProjectOverviewResponse());
                })
            .RequireAuthorization();

        // Delete project
        app.MapDelete("/api/project/{id:guid}",
                async (Guid id, ProjectService projectService) =>
                {
                    var result = await projectService.Delete(id);
                    return !result.IsSuccess ? Results.NotFound() : Results.NoContent();
                })
            .RequireAuthorization();
        
        // Add topic
        app.MapPost("/api/project/topic",
                async ([FromBody] AddTopicRequest request, ProjectService projectService) =>
                {
                    var result = await projectService.AddTopic(request);
                    return !result.IsSuccess
                        ? Results.BadRequest()
                        : Results.Ok(new { Id = result.Payload!.ToProjectResponseTopic() });
                })
            .RequireAuthorization();
        
        
        // Delete topic
        app.MapDelete("/api/project/topic/{id:guid}",
                async (Guid id, ProjectService projectService) =>
                {
                    var result = await projectService.DeleteTopic(id);
                    return !result.IsSuccess ? Results.NotFound() : Results.NoContent();
                })
            .RequireAuthorization();
    }
}