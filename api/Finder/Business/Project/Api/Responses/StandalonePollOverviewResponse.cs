namespace Finder.Business.Project.Api.Responses;

public class StandalonePollOverviewResponse
{
    public required string ProjectId { get; init; }
    public required string PollId { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required int OptionType { get; init; }
    public required int OptionCount { get; init; }
    public required int CommentCount { get; init; }
    public required DateTime LastUpdated { get; init; }
    public string? NextOpenOptionId { get; init; }
}

public static class StandalonePollOverviewMapper
{
    public static StandalonePollOverviewResponse ToStandalonePollOverviewResponse(this Entities.Project project, Guid? userId)
    {
        var poll = project.Polls.First();
        var newestDate = poll.Edited > project.Edited ? poll.Edited : project.Edited;

        return new StandalonePollOverviewResponse
        {
            ProjectId = project.Id.ToString(),
            PollId = poll.Id.ToString(),
            Name = poll.Name,
            Description = poll.Description,
            OptionType = (int)poll.OptionType,
            OptionCount = poll.Options.Count,
            CommentCount = poll.Comments.Count,
            LastUpdated = DateTime.SpecifyKind(newestDate, DateTimeKind.Utc),
            NextOpenOptionId = poll.Options
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
