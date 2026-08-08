using Finder.Business.Auth.Entities;

namespace Finder.Business.Project.Entities;

public class ProjectFavorite
{
    public required Guid UserId { get; set; }
    public required Person User { get; set; }
    public required Project Project { get; set; }
    public required string ProjectId { get; set; }
}
