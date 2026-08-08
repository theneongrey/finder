using Finder.Business.Shared;

namespace Finder.Business.Project.Api.Responses;

public class PollParticipant
{
    public required string Name { get; init; }
    public string? Picture { get; init; }
    public required int VotingStatus { get; init; } // 0 = None, 1 = Partial, 2 = Full
}

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
    public DateTime? LastVoteAt { get; init; }
    public string? NextOpenOptionId { get; init; }
    public required int VisibilityType { get; init; }
    public required ICollection<ProjectSharedWith> SharedWith { get; init; }
    public required ProjectRole Role { get; init; }
    public required int TotalParticipants { get; init; }
    public required int VotedCount { get; init; }
    public required bool CurrentUserVoted { get; init; }
    public required ICollection<PollParticipant> Participants { get; init; }
    public required bool IsFavorite { get; init; }
    public DateTime? CloseDate { get; init; }
    public required bool IsClosed { get; init; }
}

public static class StandalonePollOverviewMapper
{
    public static StandalonePollOverviewResponse ToStandalonePollOverviewResponse(this Entities.Project project, Guid? userId)
    {
        var poll = project.Polls.First();
        var newestDate = poll.Edited > project.Edited ? poll.Edited : project.Edited;

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

        var nextOption = poll.Options
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
            .FirstOrDefault()?.Option;

        var lastVoteDate = poll.Options.SelectMany(o => o.Votes).Select(v => (DateTime?)v.Created).Max();
        var allVotes = poll.Options.SelectMany(o => o.Votes).ToList();
        var votedCount = allVotes.Select(v => v.Person.Id).Distinct().Count();
        var currentUserVoted = userId.HasValue && allVotes.Any(v => v.Person.Id == userId.Value);

        var optionCount = poll.Options.Count;
        var votesByPerson = poll.Options
            .SelectMany(o => o.Votes.Select(v => (PersonId: v.Person.Id, OptionId: o.Id)))
            .GroupBy(x => x.PersonId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.OptionId).Distinct().Count());

        var allMembers = new[] { (Name: project.Creator.Name ?? project.Creator.Email, project.Creator.Picture, Id: project.Creator.Id) }
            .Concat(project.Permissions
                .Where(p => p.PersonKey != project.Creator.Id)
                .Select(p => (Name: p.Person.Name ?? p.Person.Email, p.Person.Picture, Id: p.Person.Id)));

        var participants = allMembers.Select(m =>
        {
            var voted = votesByPerson.GetValueOrDefault(m.Id, 0);
            var status = voted == 0 ? 0 : (optionCount > 0 && voted >= optionCount) ? 2 : 1;
            return new PollParticipant { Name = m.Name, Picture = m.Picture, VotingStatus = status };
        }).ToArray();

        return new StandalonePollOverviewResponse
        {
            ProjectId = SlugHelper.ToSlug(project.Name, project.Id),
            PollId = SlugHelper.ToSlug(poll.Name, poll.Id),
            Name = poll.Name,
            Description = poll.Description,
            OptionType = (int)poll.OptionType,
            OptionCount = poll.Options.Count,
            CommentCount = poll.Comments.Count,
            LastUpdated = DateTime.SpecifyKind(newestDate, DateTimeKind.Utc),
            LastVoteAt = lastVoteDate.HasValue ? DateTime.SpecifyKind(lastVoteDate.Value, DateTimeKind.Utc) : null,
            NextOpenOptionId = nextOption is null ? null : SlugHelper.ToSlug(SlugHelper.OptionSlugName(nextOption.Text), nextOption.Id),
            VisibilityType = (int)project.VisibilityType,
            SharedWith = sharedWith.ToArray(),
            Role = project.GetRole(userId),
            TotalParticipants = project.Permissions.Count(p => p.PersonKey != project.Creator.Id) + 1,
            VotedCount = votedCount,
            CurrentUserVoted = currentUserVoted,
            Participants = participants,
            IsFavorite = userId.HasValue && project.Favorites.Any(f => f.UserId == userId.Value),
            CloseDate = poll.CloseDate.HasValue ? DateTime.SpecifyKind(poll.CloseDate.Value, DateTimeKind.Utc) : null,
            IsClosed = poll.CloseDate != null && poll.CloseDate <= DateTime.UtcNow
        };
    }
}
