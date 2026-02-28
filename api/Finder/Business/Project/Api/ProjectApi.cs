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
                async (ProjectService projectService, UserService userService) => Results.Ok(
                    (await projectService.GetAll()).Select(p => p.ToProjectOverviewResponse(userService.GetUserId()))))
            .RequireAuthorization();

        // Get single project
        app.MapGet("/api/project/{id:guid}", async (Guid id, ProjectService projectService, UserService userService) =>
        {
            var result = await projectService.Get(id);
            return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToProjectResponse(userService.GetUserId()));
        }).RequireAuthorization();

        // Add project
        app.MapPost("/api/project",
                async ([FromBody] ProjectRequest request, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.Create(request.Name);
                    return !result.IsSuccess
                        ? Results.BadRequest()
                        : Results.Ok(result.Payload!.ToProjectOverviewResponse(userService.GetUserId()));
                })
            .RequireAuthorization();

        // Update project
        app.MapPut("/api/project/{id:guid}",
                async (Guid id, [FromBody] ProjectRequest request, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.Update(id, request.Name);
                    return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToProjectOverviewResponse(userService.GetUserId()));
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
                        : Results.Ok(result.Payload!.ToProjectResponseTopic(userService.GetUserId()));
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