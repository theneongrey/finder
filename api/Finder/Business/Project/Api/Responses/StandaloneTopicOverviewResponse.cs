namespace Finder.Business.Project.Api.Responses;

public class StandaloneTopicOverviewResponse
{
    public required string ProjectId { get; init; }
    public required string TopicId { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required int OptionType { get; init; }
    public required int OptionCount { get; init; }
    public required int CommentCount { get; init; }
    public required DateTime LastUpdated { get; init; }
    public string? NextOpenOptionId { get; init; }
}

public static class StandaloneTopicOverviewMapper
{
    public static StandaloneTopicOverviewResponse ToStandaloneTopicOverviewResponse(this Entities.Project project, Guid? userId)
    {
        var topic = project.Topics.First();
        var newestDate = topic.Edited > project.Edited ? topic.Edited : project.Edited;

        return new StandaloneTopicOverviewResponse
        {
            ProjectId = project.Id.ToString(),
            TopicId = topic.Id.ToString(),
            Name = topic.Name,
            Description = topic.Description,
            OptionType = (int)topic.OptionType,
            OptionCount = topic.Options.Count,
            CommentCount = topic.Comments.Count,
            LastUpdated = DateTime.SpecifyKind(newestDate, DateTimeKind.Utc),
            NextOpenOptionId = topic.Options
                .Select(o => new {
                    Option = o,
                    UserChoice = o.Votes
                        .Where(v => v.Person.Id == userId)
                        .Select(v => int.TryParse(v.Choice, out var cv) ? (int?)cv : null)
                        .FirstOrDefault()
                })
                .Where(x => x.UserChoice == null || x.UserChoice < 0)
                .OrderBy(x => x.UserChoice == null ? 0 : 1)
                .ThenByDescending(x => x.UserChoice ?? 0)
                .ThenBy(x => x.Option.Created)
                .FirstOrDefault()?.Option.Id.ToString()
        };
    }
}
