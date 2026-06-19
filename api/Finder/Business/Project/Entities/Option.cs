using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public class Option : BaseEntity
{
    public required Guid Id { get; set; }
    public required string Text { get; set; }
    public required string Description { get; set; }
    public required string Url { get; set; }
    public required string PreviewImageUrl { get; set; }

    public required Topic Topic { get; set; }
    public List<Vote> Votes { get; set; } = [];
}