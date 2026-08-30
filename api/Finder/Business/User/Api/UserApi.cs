using Finder.Business.User.Api.Requests;
using Finder.Business.User.Api.Responses;
using Finder.Business.User.Services;
using Microsoft.AspNetCore.Mvc;

namespace Finder.Business.User.Api;

public static class UserApi
{
    public static void WithUserApi(this WebApplication app)
    {
        app.MapPut("/api/user", async ([FromBody] UpdateUserRequest request, ProfileService profileService) =>
        {
            var result = await profileService.UpdateProfile(request.Name, request.Language);
            if (!result.IsSuccess)
            {
                return Results.NotFound();
            }

            return Results.Ok(result.Payload!.ToPersonResponse(true));
        }).RequireAuthorization();

        app.MapGet("/api/user/notifications", async (NotificationSettingsService svc) =>
        {
            var result = await svc.GetSettings();
            return result.IsSuccess ? Results.Ok(result.Payload) : Results.StatusCode(result.Code);
        }).RequireAuthorization();

        app.MapPut("/api/user/notifications/{id:int}", async (int id, [FromBody] UpdateNotificationSettingRequest request, NotificationSettingsService svc) =>
        {
            var result = await svc.UpdateSetting(id, request.Value);
            return result.IsSuccess ? Results.Ok(result.Payload) : Results.StatusCode(result.Code);
        }).RequireAuthorization();
    }
}
