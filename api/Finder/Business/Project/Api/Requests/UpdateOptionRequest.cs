namespace Finder.Business.Project.Api.Requests;

public class UpdateOptionRequest
{
    public required string Text { get; set; }
    public required string Description { get; set; }
    public required string Url { get; set; }
}
