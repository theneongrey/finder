namespace Finder.Business.Project.Api.Responses;

public class ProjectOverviewResponse
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Creator { get; set; }
    public required int TopicCount { get; set; } 
    public required ProjectRole Role { get; set; }
}

public static class ProjectOverviewMapper
{
    public static ProjectOverviewResponse ToProjectOverviewResponse(this Entities.Project project, Guid? userId)
    {
        return new ProjectOverviewResponse
        {
            Id = project.Id.ToString(),
            Name = project.Name,
            Creator = project.Creator.Name ?? "",
            TopicCount = project.Topics.Count,
            Role = project.GetRole(userId)
        };
    }
}