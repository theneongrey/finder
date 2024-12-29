using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public class Question : BaseEntity
{
    public required Guid Id { get; set; }
    public required string Text { get; set; }
    
    public required Topic Topic { get; set; }
    public required List<Option> Options { get; set; } = [];
}