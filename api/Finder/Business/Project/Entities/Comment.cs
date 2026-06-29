using Finder.Business.Auth.Entities;
using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public class Comment : BaseEntity
{
    public required Guid Id { get; set; }
    public required string Content { get; set; }
    public string? Quote { get; set; }

    public required Poll Poll { get; set; }
    public required Person Person { get; set; }
}
