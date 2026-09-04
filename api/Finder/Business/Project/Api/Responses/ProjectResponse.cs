using Finder.Business.Shared;

namespace Finder.Business.Project.Api.Responses;

public class PublicPollOptionPreview
{
    public required string Id { get; set; }
    public required string Text { get; set; }
    public required string Description { get; set; }
    public required int VoteCount { get; set; }
}

public class PublicPollPreview
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required int OptionType { get; set; }
    public DateTime? CloseDate { get; set; }
    public required bool IsClosed { get; set; }
    public required PublicPollOptionPreview[] Options { get; set; }
    public required int ParticipantCount { get; set; }
    public required int TotalVotes { get; set; }
}

public class PublicParticipant
{
    public required string Name { get; set; }
    public required bool HasVoted { get; set; }
}

public class PublicProjectResponse
{
    public required string ProjectId { get; set; }
    public required bool IsStandalone { get; set; }
    public string? PollId { get; set; }
    public PublicPollPreview? PollPreview { get; set; }
    public required string ProjectName { get; set; }
    public string? ProjectDescription { get; set; }
    public required PublicParticipant[] Participants { get; set; }
}

public class ProjectResponseOption
{
    public required string Id { get; set; }
    public required string Text { get; set; }
    public required string Description { get; set; }
    public PollResponseOptionMeta? Meta { get; set; }
    public required int Votes { get; set; }
    public required string? Choice { get; set; }
}

public class ProjectSharedWith
{
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required ProjectRole Role { get; set; }
    public string? Picture { get; set; }
}

public class ProjectResponsePoll
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required int OptionType { get; set; }
    public required int OptionCount { get; set; }
    public required int CommentCount { get; set; }
    public string? NextOpenOptionId { get; set; }
}

public class ProjectResponse
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required ProjectResponsePoll[] Polls { get; set; }
    public required int VisibilityType { get; set; }
    public required string Creator { get; set; }
    public required ProjectRole Role { get; set; }
    public required ProjectSharedWith[] SharedWith { get; set; }
}

public static class ProjectMapper
{
    public static PublicPollPreview ToPublicPollPreview(this Entities.Poll poll, int participantCount)
    {
        return new PublicPollPreview
        {
            Id = SlugHelper.ToSlug(poll.Name, poll.Id),
            Name = poll.Name,
            Description = poll.Description,
            OptionType = (int)poll.OptionType,
            CloseDate = poll.CloseDate.HasValue ? DateTime.SpecifyKind(poll.CloseDate.Value, DateTimeKind.Utc) : null,
            IsClosed = poll.CloseDate != null && poll.CloseDate <= DateTime.UtcNow,
            Options = poll.Options
                .OrderBy(o => o.Created)
                .Select(o => new PublicPollOptionPreview
                {
                    Id = SlugHelper.ToSlug(SlugHelper.OptionSlugName(o.Text), o.Id),
                    Text = o.Text,
                    Description = o.Description,
                    VoteCount = o.Votes.Count
                })
                .ToArray(),
            ParticipantCount = participantCount,
            TotalVotes = poll.Options.Sum(o => o.Votes.Count)
        };
    }

    public static PublicProjectResponse ToPublicProjectResponse(this Entities.Project project, Guid? userId = null)
    {
        var firstPoll = project.IsStandalone ? project.Polls.FirstOrDefault() : null;

        PublicParticipant[] participants = [];
        if (userId.HasValue)
        {
            var voterIds = project.Polls
                .SelectMany(p => p.Options)
                .SelectMany(o => o.Votes)
                .Select(v => v.Person.Id)
                .ToHashSet();

            var creator = new PublicParticipant
            {
                Name = project.Creator.Name ?? project.Creator.Email,
                HasVoted = voterIds.Contains(project.Creator.Id)
            };

            var permParticipants = project.Permissions
                .Where(p => p.PersonKey != project.Creator.Id && p.Person != null)
                .Select(p => new PublicParticipant
                {
                    Name = p.Person.Name ?? p.Person.Email,
                    HasVoted = voterIds.Contains(p.PersonKey)
                });

            participants = new[] { creator }.Concat(permParticipants).ToArray();
        }

        return new PublicProjectResponse
        {
            ProjectId = SlugHelper.ToSlug(project.Name, project.Id),
            IsStandalone = project.IsStandalone,
            PollId = firstPoll is null ? null : SlugHelper.ToSlug(firstPoll.Name, firstPoll.Id),
            PollPreview = firstPoll?.ToPublicPollPreview(project.Permissions.Count(p => p.PersonKey != project.Creator.Id) + 1),
            ProjectName = project.Name,
            ProjectDescription = project.Description ?? firstPoll?.Description,
            Participants = participants
        };
    }

    public static ProjectResponseOption ToProjectResponseOption(this Entities.Option option, Guid? userId)
    {
        return new ProjectResponseOption
        {
            Id = SlugHelper.ToSlug(SlugHelper.OptionSlugName(option.Text), option.Id),
            Text = option.Text,
            Description = option.Description,
            Meta = option.Meta is null ? null : new PollResponseOptionMeta
            {
                Url = option.Meta.Url,
                Title = option.Meta.Title,
                Description = option.Meta.Description,
                ImageUrl = option.Meta.ImageUrl,
                SiteName = option.Meta.SiteName
            },
            Votes = option.Votes.Count,
            Choice = option.Votes.FirstOrDefault(v => v.Person.Id == userId)?.Choice,
        };
    }

    public static ProjectResponsePoll ToProjectResponsePoll(this Entities.Poll poll, Guid? userId)
    {
        var nextOption = poll.Options
            .Select(o => new
            {
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

        return new ProjectResponsePoll
        {
            Id = SlugHelper.ToSlug(poll.Name, poll.Id),
            Name = poll.Name,
            Description = poll.Description,
            OptionType = (int)poll.OptionType,
            OptionCount = poll.Options.Count,
            CommentCount = poll.Comments.Count,
            NextOpenOptionId = nextOption is null ? null : SlugHelper.ToSlug(SlugHelper.OptionSlugName(nextOption.Text), nextOption.Id)
        };
    }

    public static ProjectSharedWith ToProjectSharedWith(this Permission.Entities.Permission permission)
    {
        return new ProjectSharedWith
        {
            Name = permission.Person.Name ?? permission.Person.Email,
            Email = permission.Person.Email,
            Role = permission.PermissionType.ToProjectRole(),
            Picture = permission.Person.Picture
        };
    }

    public static ProjectResponse ToProjectResponse(this Entities.Project project, Guid? userId)
    {
        var sharedWith = project.Permissions
            .Where(p => p.PersonKey != project.Creator.Id)
            .Select(ToProjectSharedWith);

        sharedWith = sharedWith.Prepend(
            new ProjectSharedWith
            {
                Name = project.Creator.Name ?? project.Creator.Email,
                Email = project.Creator.Email,
                Role = ProjectRole.Creator,
                Picture = project.Creator.Picture
            });

        return new ProjectResponse
        {
            Id = SlugHelper.ToSlug(project.Name, project.Id),
            Name = project.Name,
            Description = project.Description,
            Polls = project.Polls.OrderBy(t => t.Created).Select(t => t.ToProjectResponsePoll(userId)).ToArray(),
            VisibilityType = (int)project.VisibilityType,
            Creator = project.Creator.Name ?? project.Creator.Email,
            Role = project.GetRole(userId),
            SharedWith = sharedWith.ToArray()
        };
    }
}
