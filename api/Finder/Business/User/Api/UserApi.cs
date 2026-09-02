using Finder.Business.User.Api.Requests;
using Finder.Business.User.Api.Responses;
using Finder.Business.User.Services;
using Finder.Business.Shared.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

        app.MapGet("/api/user/notifications/settings", async (NotificationSettingsService svc) =>
        {
            var result = await svc.GetSettings();
            return result.IsSuccess ? Results.Ok(result.Payload) : Results.StatusCode(result.Code);
        }).RequireAuthorization();

        app.MapPut("/api/user/notifications/settings/{id:int}", async (int id, [FromBody] UpdateNotificationSettingRequest request, NotificationSettingsService svc) =>
        {
            var result = await svc.UpdateSetting(id, request.Value);
            return result.IsSuccess ? Results.Ok(result.Payload) : Results.StatusCode(result.Code);
        }).RequireAuthorization();

        app.MapGet("/api/user/notifications", async (UserService userService, Finder.Database.AppDbContext dbContext) =>
        {
            var userResult = await userService.GetUser();
            if (!userResult.IsSuccess) return Results.Unauthorized();

            var notifications = await dbContext.UserNotifications
                .Where(n => n.PersonId == userResult.Payload!.Id)
                .OrderByDescending(n => n.Created)
                .Select(n => n.ToUserNotificationResponse())
                .ToListAsync();

            return Results.Ok(notifications);
        }).RequireAuthorization();

        app.MapDelete("/api/user/notifications/{id:guid}", async (Guid id, UserService userService, Finder.Database.AppDbContext dbContext) =>
        {
            var userResult = await userService.GetUser();
            if (!userResult.IsSuccess) return Results.Unauthorized();

            var notification = await dbContext.UserNotifications
                .FirstOrDefaultAsync(n => n.Id == id && n.PersonId == userResult.Payload!.Id);

            if (notification is null) return Results.NotFound();

            dbContext.UserNotifications.Remove(notification);
            await dbContext.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization();

        app.MapDelete("/api/user/notifications", async (UserService userService, Finder.Database.AppDbContext dbContext) =>
        {
            var userResult = await userService.GetUser();
            if (!userResult.IsSuccess) return Results.Unauthorized();

            var notifications = await dbContext.UserNotifications
                .Where(n => n.PersonId == userResult.Payload!.Id)
                .ToListAsync();

            dbContext.UserNotifications.RemoveRange(notifications);
            await dbContext.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization();
    }
}
