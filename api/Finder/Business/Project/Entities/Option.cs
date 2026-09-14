using Finder.Business.Auth.Entities;
using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public class Option : BaseEntity
{
    public required string Id { get; set; }
    public required string Text { get; set; }
    public required string Description { get; set; }

    public required Poll Poll { get; set; }
    public OptionMeta? Meta { get; set; }
    public List<Vote> Votes { get; set; } = [];

    public required Person Creator { get; set; }
    public Guid CreatorId { get; set; }
}