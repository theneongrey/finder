using Finder.Business.Feedback.Api.Requests;
using Finder.Business.Feedback.Api.Responses;
using Finder.Business.Feedback.Services;
using Microsoft.AspNetCore.Mvc;

namespace Finder.Business.Feedback.Api;

public static class FeedbackApi
{
    public static void WithFeedbackApi(this WebApplication app)
    {
        app.MapGet("/api/feedback/preference", async (FeedbackPreferenceService preferenceService, TimeProvider timeProvider) =>
        {
            var result = await preferenceService.GetPreference();
            return result is { IsSuccess: true, Payload: not null }
                ? Results.Ok(result.Payload.ToFeedbackPreferenceResponse(timeProvider.GetUtcNow().UtcDateTime))
                : Results.StatusCode(result.Code);
        }).RequireAuthorization();

        app.MapPut("/api/feedback/preference", async ([FromBody] UpdateFeedbackPreferenceRequest request, FeedbackPreferenceService preferenceService, TimeProvider timeProvider) =>
        {
            var result = await preferenceService.UpdatePreference(request.ButtonHidden);
            return result is { IsSuccess: true, Payload: not null }
                ? Results.Ok(result.Payload.ToFeedbackPreferenceResponse(timeProvider.GetUtcNow().UtcDateTime))
                : Results.StatusCode(result.Code);
        }).RequireAuthorization();

        app.MapPost("/api/feedback", async ([FromBody] SubmitFeedbackRequest request, FeedbackService feedbackService) =>
            {
                var result = await feedbackService.SubmitFeedback(request.Type, request.Comment, request.Page);
                return result.IsSuccess ? Results.NoContent() : Results.StatusCode(result.Code);
            })
            .RequireAuthorization()
            .RequireRateLimiting("feedback");
    }
}
