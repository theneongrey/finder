using Finder.Business.Project.Api.Requests;
using Finder.Business.Project.Api.Responses;
using Finder.Business.Project.Services;
using Microsoft.AspNetCore.Mvc;

namespace Finder.Business.Project.Api;

public static class ProjectApi
{
    public static void WithProjectApi(this WebApplication app)
    {
        app.MapGet("/api/project",
                async (ProjectService projectService) => Results.Ok(
                    (await projectService.GetAll()).Select(p => p.ToProjectOverviewResponse())))
            .RequireAuthorization();

        app.MapGet("/api/project/{id:guid}", async (Guid id, ProjectService projectService) =>
        {
            var result = await projectService.Get(id);
            return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToProjectOverviewResponse());
        }).RequireAuthorization();

        app.MapPost("/api/project",
                async ([FromBody] ProjectRequest request, ProjectService projectService) =>
                {
                    var result = await projectService.Create(request.Name);
                    return !result.IsSuccess
                        ? Results.BadRequest()
                        : Results.Ok(result.Payload!.ToProjectOverviewResponse());
                })
            .RequireAuthorization();

        app.MapPut("/api/project/{id:guid}",
                async (Guid id, [FromBody] ProjectRequest request, ProjectService projectService) =>
                {
                    var result = await projectService.Update(id, request.Name);
                    return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToProjectResponse());
                })
            .RequireAuthorization();

        app.MapDelete("/api/project/{id:guid}",
                async (Guid id, ProjectService projectService) =>
                {
                    var result = await projectService.Delete(id);
                    return !result.IsSuccess ? Results.NotFound() : Results.NoContent();
                })
            .RequireAuthorization();
        
        app.MapPost("/api/project/topic",
                async ([FromBody] TopicRequest request, ProjectService projectService) =>
                {
                    var result = await projectService.AddTopic(request.ProjectId, request.Name);
                    return !result.IsSuccess
                        ? Results.BadRequest()
                        : Results.Ok(result.Payload!.ToProjectOverviewResponse());
                })
            .RequireAuthorization();
    }
}