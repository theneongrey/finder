using Finder.Business.Auth.Entities;

namespace Finder.Business.User.Entities;

public class PersonNotificationSetting
{
    public Guid PersonId { get; set; }
    public int NotificationSettingId { get; set; }
    public NotificationValue Value { get; set; }
    public Person Person { get; set; } = null!;
    public NotificationSetting NotificationSetting { get; set; } = null!;
}
