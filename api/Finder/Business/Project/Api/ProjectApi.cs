using Finder.Business.Project.Api.Requests;
using Finder.Business.Project.Api.Responses;
using Finder.Business.Project.Services;
using Finder.Business.Shared.Services;
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
        app.MapGet("/api/project/{id:guid}", async (Guid id, ProjectService projectService, UserService userService) =>
        {
            var result = await projectService.Get(id);
            return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToProjectResponse(userService.GetUserId()));
        }).RequireAuthorization();

        // Add project
        app.MapPost("/api/project",
                async ([FromBody] AddProjectRequest request, ProjectService projectService) =>
                {
                    var result = await projectService.Create(request.Name, request.Description);
                    return !result.IsSuccess
                        ? Results.BadRequest()
                        : Results.Ok(result.Payload!.ToProjectOverviewResponse());
                })
            .RequireAuthorization();

        // Update project
        app.MapPut("/api/project/{id:guid}",
                async (Guid id, [FromBody] AddProjectRequest request, ProjectService projectService) =>
                {
                    var result = await projectService.Update(id, request.Name, request.Description);
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
                async ([FromBody] AddTopicRequest request, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.AddTopic(request);
                    return !result.IsSuccess
                        ? Results.BadRequest()
                        : Results.Ok(result.Payload!.ToTopicResponse(userService.GetUserId()));
                })
            .RequireAuthorization();

        // Get topic
        app.MapGet("/api/project/topic/{id:guid}",
                async (Guid id, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.GetTopic(id);
                    return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToTopicResponse(userService.GetUserId()));
                })
            .RequireAuthorization();

        // Update topic
        app.MapPut("/api/project/topic/{id:guid}",
                async (Guid id, [FromBody] UpdateTopicRequest request, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.UpdateTopic(id, request.Name);
                    return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToTopicResponse(userService.GetUserId()));
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

        // Add option
        app.MapPost("/api/project/topic/option",
                async ([FromBody] AddOptionToTopicRequest request, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.AddOptionToTopic(request);
                    return !result.IsSuccess
                        ? Results.BadRequest()
                        : Results.Ok(result.Payload!.ToProjectResponseOption(userService.GetUserId()));
                })
            .RequireAuthorization();
        
        // Update option
        app.MapPut("/api/project/topic/option/{id:guid}",
                async (Guid id, [FromBody] UpdateOptionRequest request, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.UpdateOption(id, request.Text);
                    return !result.IsSuccess
                        ? Results.NotFound()
                        : Results.Ok(result.Payload!.ToTopicResponseOption(userService.GetUserId()));
                })
            .RequireAuthorization();

        // Delete topic
        app.MapDelete("/api/project/topic/option/{id:guid}",
                async (Guid id, ProjectService projectService) =>
                {
                    var result = await projectService.DeleteOption(id);
                    return !result.IsSuccess ? Results.NotFound() : Results.NoContent();
                })
            .RequireAuthorization();
        
        // Vote
        app.MapPut("/api/project/topic/vote/{optionId:guid}",
                async (Guid optionId, VoteService voteService, [FromBody] VoteRequest request) =>
                {
                    var result = await voteService.Vote(optionId, request.Choice);
                    return !result.IsSuccess ? Results.NotFound() : Results.NoContent();
                })
            .RequireAuthorization();
    }
}