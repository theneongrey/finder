using Finder.Business.User.Entities;

namespace Finder.Business.User.Api.Responses;

public class UserNotificationResponse
{
    public Guid Id { get; set; }
    public string Key { get; set; } = "";
    public string? ProjectId { get; set; }
    public string? PollId { get; set; }
    public Dictionary<string, string> Variables { get; set; } = [];
    public DateTime Created { get; set; }
}

public static class UserNotificationMapper
{
    public static UserNotificationResponse ToUserNotificationResponse(this UserNotification notification)
    {
        return new UserNotificationResponse
        {
            Id = notification.Id,
            Key = notification.Key.ToString(),
            ProjectId = notification.ProjectId,
            PollId = notification.PollId,
            Variables = notification.Variables,
            Created = notification.Created,
        };
    }
}
