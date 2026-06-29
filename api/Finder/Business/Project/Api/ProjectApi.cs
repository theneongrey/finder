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

        // Get standalone polls
        app.MapGet("/api/project/standalone-polls",
                async (ProjectService projectService, UserService userService) => Results.Ok(
                    (await projectService.GetAllStandalonePolls()).Select(p => p.ToStandalonePollOverviewResponse(userService.GetUserId()))))
            .RequireAuthorization();

        // Create standalone poll (creates backing project + poll atomically)
        app.MapPost("/api/project/standalone-poll",
                async ([FromBody] AddStandalonePollRequest request, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.CreateStandalonePoll(request.Name, request.Description, request.OptionType);
                    return !result.IsSuccess
                        ? Results.BadRequest()
                        : Results.Ok(result.Payload!.ToStandalonePollOverviewResponse(userService.GetUserId()));
                })
            .RequireAuthorization();

        // Add poll
        app.MapPost("/api/project/poll",
                async ([FromBody] AddPollRequest request, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.AddPoll(request);
                    return !result.IsSuccess
                        ? Results.BadRequest()
                        : Results.Ok(result.Payload!.ToPollResponse(userService.GetUserId()));
                })
            .RequireAuthorization();

        // Get poll
        app.MapGet("/api/project/poll/{id:guid}",
                async (Guid id, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.GetPoll(id);
                    return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToPollResponse(userService.GetUserId()));
                })
            .RequireAuthorization();

        // Update poll
        app.MapPut("/api/project/poll/{id:guid}",
                async (Guid id, [FromBody] UpdatePollRequest request, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.UpdatePoll(id, request.Name, request.Description);
                    return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToPollResponse(userService.GetUserId()));
                })
            .RequireAuthorization();

        // Delete poll
        app.MapDelete("/api/project/poll/{id:guid}",
                async (Guid id, ProjectService projectService) =>
                {
                    var result = await projectService.DeletePoll(id);
                    return !result.IsSuccess ? Results.NotFound() : Results.NoContent();
                })
            .RequireAuthorization();

        // Add option
        app.MapPost("/api/project/poll/option",
                async ([FromBody] AddOptionToPollRequest request, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.AddOptionToPoll(request);
                    return !result.IsSuccess
                        ? Results.BadRequest()
                        : Results.Ok(result.Payload!.ToProjectResponseOption(userService.GetUserId()));
                })
            .RequireAuthorization();

        // Update option
        app.MapPut("/api/project/poll/option/{id:guid}",
                async (Guid id, [FromBody] UpdateOptionRequest request, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.UpdateOption(id, request.Text, request.Description, request.Url);
                    return !result.IsSuccess
                        ? Results.NotFound()
                        : Results.Ok(result.Payload!.ToPollResponseOption(userService.GetUserId()));
                })
            .RequireAuthorization();

        // Delete option
        app.MapDelete("/api/project/poll/option/{id:guid}",
                async (Guid id, ProjectService projectService) =>
                {
                    var result = await projectService.DeleteOption(id);
                    return !result.IsSuccess ? Results.NotFound() : Results.NoContent();
                })
            .RequireAuthorization();

        // Vote
        app.MapPut("/api/project/poll/vote/{optionId:guid}",
                async (Guid optionId, VoteService voteService, [FromBody] VoteRequest request) =>
                {
                    var result = await voteService.Vote(optionId, request.Choice);
                    return !result.IsSuccess ? Results.NotFound() : Results.NoContent();
                })
            .RequireAuthorization();

        // Add comment
        app.MapPost("/api/project/poll/comment",
                async ([FromBody] AddCommentRequest request, ProjectService projectService) =>
                {
                    var result = await projectService.AddComment(request);
                    return !result.IsSuccess
                        ? Results.NotFound()
                        : Results.Ok(result.Payload!.ToCommentResponse());
                })
            .RequireAuthorization();
    }
}
