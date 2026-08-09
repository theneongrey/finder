using Finder.Business.Auth.Entities;
using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public enum PollStatusAction { Closed, Reopened }

public class PollStatusChange : BaseEntity
{
    public required Guid Id { get; set; }
    public required PollStatusAction Action { get; set; }
    public required Poll Poll { get; set; }
    public required Person ChangedBy { get; set; }
}
