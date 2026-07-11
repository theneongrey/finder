using Finder.Business.Shared;

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
    public required int VisibilityType { get; init; }
    public required ICollection<ProjectSharedWith> SharedWith { get; init; }
}

public class ProjectOverviewPollResponse
{
    public required string Id { get; init; }
    public required string Name { get; init; }
}

public static class ProjectOverviewMapper
{
    public static ProjectOverviewResponse ToProjectOverviewResponse(this Entities.Project project, Guid? userId)
    {
        var newestPoll = project.Polls.OrderByDescending(t => t.Edited).FirstOrDefault();
        var lastUpdated = newestPoll is not null && newestPoll.Edited > project.Edited
            ? newestPoll.Edited
            : project.Edited;

        var sharedWith = project.Permissions
            .Where(p => p.PersonKey != userId && p.PersonKey != project.Creator.Id)
            .Select(ProjectMapper.ToProjectSharedWith);

        if (userId != project.Creator.Id)
        {
            sharedWith = sharedWith.Prepend(new ProjectSharedWith
            {
                Name = project.Creator.Name ?? project.Creator.Email,
                Email = project.Creator.Email,
                Role = ProjectRole.Creator,
                Picture = project.Creator.Picture
            });
        }

        return new ProjectOverviewResponse
        {
            Id = SlugHelper.ToSlug(project.Name, project.Id),
            Name = project.Name,
            Description = project.Description,
            Creator = project.Creator.Name ?? "",
            Polls = project.Polls.Take(3).Select(t => new ProjectOverviewPollResponse
            {
                Id = SlugHelper.ToSlug(t.Name, t.Id),
                Name = t.Name
            }).ToArray(),
            PollCount = project.Polls.Count,
            LastUpdated = DateTime.SpecifyKind(lastUpdated, DateTimeKind.Utc),
            VisibilityType = (int)project.VisibilityType,
            SharedWith = sharedWith.ToArray()
        };
    }
}
