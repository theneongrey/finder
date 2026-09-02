using Finder.Business.Shared;
using Finder.Business.User.Entities;
using Finder.Database;

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
}
