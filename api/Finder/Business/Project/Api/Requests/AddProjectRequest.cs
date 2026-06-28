namespace Finder.Business.Project.Api.Requests;

public class AddProjectRequest
{
    public required string Name { get; set; }
    public string? Description { get; set; }
}