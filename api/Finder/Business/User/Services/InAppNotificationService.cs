using Finder.Business.Shared;
using Finder.Business.User.Entities;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.User.Services;

public class InAppNotificationService(AppDbContext dbContext)
{
    public async Task CreateAsync(
        Guid personId,
        NotificationKey key,
        string? projectId,
        string? pollId,
        Dictionary<string, string> variables)
    {
        dbContext.UserNotifications.Add(new UserNotification
        {
            Id = Guid.NewGuid(),
            PersonId = personId,
            Key = key,
            ProjectId = projectId,
            PollId = pollId,
            Variables = variables,
        });
        await dbContext.SaveChangesAsync();
    }

    public async Task<List<UserNotification>> GetNotificationsAsync(Guid personId)
    {
        return await dbContext.UserNotifications
            .Where(n => n.PersonId == personId)
            .OrderByDescending(n => n.Created)
            .ToListAsync();
    }

    public async Task<bool> MarkAsReadAsync(Guid id, Guid personId)
    {
        var notification = await dbContext.UserNotifications
            .FirstOrDefaultAsync(n => n.Id == id && n.PersonId == personId);
        if (notification is null)
        {
            return false;
        }

        dbContext.UserNotifications.Remove(notification);
        await dbContext.SaveChangesAsync();
        return true;
    }

    public async Task MarkAllAsReadAsync(Guid personId)
    {
        await dbContext.UserNotifications
            .Where(n => n.PersonId == personId)
            .ExecuteDeleteAsync();
    }
}
