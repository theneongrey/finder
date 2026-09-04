using System.Text.Json;
using Finder.Business.User.Entities;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Shared.Services;

public class NotificationMailGuard(AppDbContext dbContext)
{
    public async Task<bool> ShouldSendAsync(Guid personId, NotificationKey notificationKey, string? projectId = null)
    {
        var keyString = JsonNamingPolicy.CamelCase.ConvertName(Enum.GetName(notificationKey)!);

        var value = await dbContext.PersonNotificationSettings
            .Where(s => s.PersonId == personId && s.NotificationSetting.Key == keyString)
            .Select(s => (NotificationValue?)s.Value)
            .FirstOrDefaultAsync();

        if (value is null)
        {
            value = await dbContext.NotificationSettings
                .Where(s => s.Key == keyString)
                .Select(s => (NotificationValue?)s.DefaultValue)
                .FirstOrDefaultAsync() ?? NotificationValue.All;
        }

        if (value == NotificationValue.FavOnly)
        {
            if (projectId is null)
            {
                return false;
            }

            return await dbContext.ProjectFavorites
                .AnyAsync(f => f.UserId == personId && f.ProjectId == projectId);
        }

        return value == NotificationValue.All;
    }
}
