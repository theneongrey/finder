using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public class OptionMeta : BaseEntity
{
    public required Guid Id { get; set; }
    public required string Url { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string ImageUrl { get; set; }
    public required string SiteName { get; set; }

    public required Option Option { get; set; }
}
