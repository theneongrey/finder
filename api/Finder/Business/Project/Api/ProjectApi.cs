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
        // Disabled — projects are backend-only; use /api/project/standalone-polls instead
        app.MapGet("/api/project", () => Results.StatusCode(410)).RequireAuthorization();

        // Get single project
        app.MapGet("/api/project/{slug}", async (string slug, ProjectService projectService, UserService userService) =>
        {
            var result = await projectService.Get(slug);
            return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToProjectResponse(userService.GetUserId()));
        }).RequireAuthorization();

        app.MapPost("/api/project", () => Results.StatusCode(410)).RequireAuthorization();
        app.MapPut("/api/project/{slug}", () => Results.StatusCode(410)).RequireAuthorization();

        // Delete project
        app.MapDelete("/api/project/{slug}",
                async (string slug, ProjectService projectService) =>
                {
                    var result = await projectService.Delete(slug);
                    return !result.IsSuccess ? Results.NotFound() : Results.NoContent();
                })
            .RequireAuthorization();

        // Get public project info (no auth required, used for share link routing)
        app.MapGet("/api/project/public/{slug}", async (string slug, ProjectService projectService) =>
        {
            var result = await projectService.GetPublicInfo(slug);
            return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToPublicProjectResponse());
        });

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
        app.MapGet("/api/project/poll/{slug}",
                async (string slug, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.GetPoll(slug);
                    return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToPollResponse(userService.GetUserId()));
                })
            .RequireAuthorization();

        // Update poll
        app.MapPut("/api/project/poll/{slug}",
                async (string slug, [FromBody] UpdatePollRequest request, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.UpdatePoll(slug, request.Name, request.Description);
                    return !result.IsSuccess ? Results.NotFound() : Results.Ok(result.Payload!.ToPollResponse(userService.GetUserId()));
                })
            .RequireAuthorization();

        // Delete poll
        app.MapDelete("/api/project/poll/{slug}",
                async (string slug, ProjectService projectService) =>
                {
                    var result = await projectService.DeletePoll(slug);
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
        app.MapPut("/api/project/poll/option/{slug}",
                async (string slug, [FromBody] UpdateOptionRequest request, ProjectService projectService, UserService userService) =>
                {
                    var result = await projectService.UpdateOption(slug, request);
                    return !result.IsSuccess
                        ? Results.NotFound()
                        : Results.Ok(result.Payload!.ToPollResponseOption(userService.GetUserId()));
                })
            .RequireAuthorization();

        // Delete option
        app.MapDelete("/api/project/poll/option/{slug}",
                async (string slug, ProjectService projectService) =>
                {
                    var result = await projectService.DeleteOption(slug);
                    return !result.IsSuccess ? Results.NotFound() : Results.NoContent();
                })
            .RequireAuthorization();

        // Vote
        app.MapPut("/api/project/poll/vote/{optionSlug}",
                async (string optionSlug, VoteService voteService, [FromBody] VoteRequest request) =>
                {
                    var result = await voteService.Vote(optionSlug, request.Choice);
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
