namespace Finder.Business.Project.Api.Responses;

public class ProjectOverviewResponse
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required string Creator { get; init; }
    public required ICollection<ProjectOverviewTopicResponse> Topics { get; init; }
    public required int TopicCount { get; init; } 
    public required DateTime LastUpdated { get; init; }
}

public class ProjectOverviewTopicResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; } 
}

public static class ProjectOverviewMapper
{
    public static ProjectOverviewResponse ToProjectOverviewResponse(this Entities.Project project, Guid? userId)
    {
        var newestTopic = project.Topics.OrderByDescending(t => t.Edited).FirstOrDefault();
        var lastUpdated = newestTopic is not null && newestTopic.Edited > project.Edited
            ? newestTopic.Edited
            : project.Edited;
        
        return new ProjectOverviewResponse
        {
            Id = project.Id.ToString(),
            Name = project.Name,
            Description = project.Description,
            Creator = project.Creator.Name ?? "",
            Topics = project.Topics.Take(3).Select(t => new ProjectOverviewTopicResponse
            {
                Id = t.Id,
                Name = t.Name
            }).ToArray(),
            TopicCount = project.Topics.Count,
            LastUpdated = DateTime.SpecifyKind(lastUpdated, DateTimeKind.Utc)
        };
    }
}