namespace Finder.Business.Project.Api.Responses;

public class ProjectOverviewResponse
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required string Creator { get; init; }
    public required ICollection<ProjectOverviewPollResponse> Polls { get; init; }
    public required int PollCount { get; init; }
    public required DateTime LastUpdated { get; init; }
}

public class ProjectOverviewPollResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
}

public static class ProjectOverviewMapper
{
    public static ProjectOverviewResponse ToProjectOverviewResponse(this Entities.Project project)
    {
        var newestPoll = project.Polls.OrderByDescending(t => t.Edited).FirstOrDefault();
        var lastUpdated = newestPoll is not null && newestPoll.Edited > project.Edited
            ? newestPoll.Edited
            : project.Edited;

        return new ProjectOverviewResponse
        {
            Id = project.Id.ToString(),
            Name = project.Name,
            Description = project.Description,
            Creator = project.Creator.Name ?? "",
            Polls = project.Polls.Take(3).Select(t => new ProjectOverviewPollResponse
            {
                Id = t.Id,
                Name = t.Name
            }).ToArray(),
            PollCount = project.Polls.Count,
            LastUpdated = DateTime.SpecifyKind(lastUpdated, DateTimeKind.Utc)
        };
    }
}
