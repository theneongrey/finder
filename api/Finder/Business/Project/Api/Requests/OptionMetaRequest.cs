namespace Finder.Business.Project.Api.Requests;

public class OptionMetaRequest
{
    public required string Url { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string ImageUrl { get; set; }
    public required string SiteName { get; set; }
}
