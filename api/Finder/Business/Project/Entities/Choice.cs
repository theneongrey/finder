using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public class Choice : BaseEntity
{
    public required Guid Id { get; set; }
    public required string Text { get; set; }
    
    public required Option Option { get; set; }
    public List<Vote> Votes { get; set; } = [];
}