namespace Finder.Business.Project.Api.Responses;

public class ProjectResponse
{
    public required string Id { get; set; }
    public required string Name { get; set; }
}

public static class ProjectMapper
{
    public static ProjectResponse ToProjectResponse(this Entities.Project project)
    {
        return new ProjectResponse
        {
            Id = project.Id.ToString(),
            Name = project.Name,
        };
    }
}