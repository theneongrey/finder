using Finder.Business.Auth.Entities;
using Finder.Business.Shared;
using Finder.Business.Shared.Entities;

namespace Finder.Business.User.Entities;

public class UserNotification : BaseEntity
{
    public required Guid Id { get; set; }
    public required Guid PersonId { get; set; }
    public Person Person { get; set; } = null!;
    public required NotificationKey Key { get; set; }
    public string? ProjectId { get; set; }
    public string? PollId { get; set; }
    public Dictionary<string, string> Variables { get; set; } = [];
}
