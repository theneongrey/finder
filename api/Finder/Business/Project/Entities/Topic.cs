using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public enum OptionType
{
    YesNo,
    Rating,
    Date
}

public class Topic : BaseEntity
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }
    public required OptionType OptionType { get; set; }
    
    public required Project Project { get; set; }
    public List<Option> Options { get; set; } = [];
    public List<Comment> Comments { get; set; } = [];
}