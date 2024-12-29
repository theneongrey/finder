using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public class Option : BaseEntity
{
    public required Guid Id { get; set; }
    public required string Text { get; set; }
    
    public required Question Question { get; set; }
    public required List<Vote> Votes { get; set; } = [];
}