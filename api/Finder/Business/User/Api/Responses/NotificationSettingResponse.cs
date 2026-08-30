using Finder.Business.User.Entities;

namespace Finder.Business.User.Api.Responses;

public class NotificationSettingResponse
{
    public int Id { get; set; }
    public required string Key { get; set; }
    public required string TitleKey { get; set; }
    public required string DescriptionKey { get; set; }
    public NotificationValue Value { get; set; }
    public int SortIndex { get; set; }
    public NotificationValue[] AllowedValues { get; } = [NotificationValue.Off, NotificationValue.FavOnly, NotificationValue.All];
}

public static class NotificationSettingMapper
{
    public static NotificationSettingResponse ToResponse(this NotificationSetting setting, NotificationValue value) => new()
    {
        Id = setting.Id,
        Key = setting.Key,
        TitleKey = setting.TitleKey,
        DescriptionKey = setting.DescriptionKey,
        Value = value,
        SortIndex = setting.SortIndex,
    };
}
