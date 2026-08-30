using System.Text.Json.Serialization;

namespace Finder.Business.User.Entities;

[JsonConverter(typeof(JsonStringEnumConverter<NotificationValue>))]
public enum NotificationValue
{
    [JsonStringEnumMemberName("off")]    Off,
    [JsonStringEnumMemberName("favOnly")] FavOnly,
    [JsonStringEnumMemberName("all")]   All
}
