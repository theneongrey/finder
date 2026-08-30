using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Business.User.Api.Responses;
using Finder.Business.User.Entities;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.User.Services;

public class NotificationSettingsService(AppDbContext dbContext, UserService userService)
{
    public async Task<Result<List<NotificationSettingResponse>>> GetSettings()
    {
        var userId = userService.GetUserId();
        if (!userId.HasValue)
        {
            return Result<List<NotificationSettingResponse>>.Fail(401);
        }

        var result = await dbContext.NotificationSettings
            .OrderBy(s => s.SortIndex)
            .Join(
                dbContext.PersonNotificationSettings.Where(p => p.PersonId == userId),
                s => s.Id,
                p => p.NotificationSettingId,
                (s, p) => s.ToResponse(p.Value))
            .ToListAsync();

        return Result<List<NotificationSettingResponse>>.Success(result);
    }

    public async Task<Result<NotificationSettingResponse>> UpdateSetting(int id, NotificationValue value)
    {
        var userId = userService.GetUserId();
        if (!userId.HasValue)
        {
            return Result<NotificationSettingResponse>.Fail(401);
        }

        var setting = await dbContext.PersonNotificationSettings
            .Include(p => p.NotificationSetting)
            .SingleOrDefaultAsync(p => p.PersonId == userId && p.NotificationSettingId == id);

        if (setting == null)
        {
            return Result<NotificationSettingResponse>.Fail(404);
        }

        setting.Value = value;
        await dbContext.SaveChangesAsync();

        return Result<NotificationSettingResponse>.Success(setting.NotificationSetting.ToResponse(value));
    }
}
