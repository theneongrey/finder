using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public enum OptionType
{
    YesNo,
    Rating,
    Date
}

public class Poll : BaseEntity
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required OptionType OptionType { get; set; }
    public DateTime? CloseDate { get; set; }

    public required Project Project { get; set; }
    public List<Option> Options { get; set; } = [];
    public List<Comment> Comments { get; set; } = [];
}
