using Finder.Business.Auth.Entities;
using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public class Project : BaseEntity
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }
    
    public required List<Topic> Topics { get; set; } = [];
    
    public required Person Creator { get; set; }
}