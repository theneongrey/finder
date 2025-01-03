namespace Finder.Business.Project.Api.Responses;

public class ProjectOverviewResponse
{
    public required string Id { get; set; }
    public required string Name { get; set; }
}

public static class ProjectOverviewMapper
{
    public static ProjectOverviewResponse ToProjectOverviewResponse(this Entities.Project project)
    {
        return new ProjectOverviewResponse
        {
            Id = project.Id.ToString(),
            Name = project.Name,
        };
    }
}