namespace Finder.Business.User.Entities;

public class NotificationSetting
{
    public int Id { get; set; }
    public required string Key { get; set; }
    public required string TitleKey { get; set; }
    public required string DescriptionKey { get; set; }
    public NotificationValue DefaultValue { get; set; }
    public int SortIndex { get; set; }
}
