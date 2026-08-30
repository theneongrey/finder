using Finder.Business.User.Entities;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Shared.Services;

public class SeedingService(AppDbContext dbContext)
{
    public async Task SeedNotificationSettingsForPerson(Guid personId)
    {
        var definitions = await dbContext.NotificationSettings.ToListAsync();
        foreach (var def in definitions)
        {
            dbContext.PersonNotificationSettings.Add(new PersonNotificationSetting
            {
                PersonId = personId,
                NotificationSettingId = def.Id,
                Value = def.DefaultValue,
            });
        }
    }
}
