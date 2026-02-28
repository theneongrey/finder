using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public enum OptionType
{
    YesNo,
    Rating
}

public class Option : BaseEntity
{
    public required Guid Id { get; set; }
    public required string Text { get; set; }
    
    public required OptionType OptionType { get; set; }
    
    public required Topic Topic { get; set; }
    public List<Vote> Votes { get; set; } = [];
}