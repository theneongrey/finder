namespace Finder.Business.Project.Api.Responses;

public class PollResponseVote
{
    public required string Person { get; set; }
    public required string Choice { get; set; }
}

public class PollResponseOption
{
    public required string Id { get; set; }
    public required string Text { get; set; }
    public required string Description { get; set; }
    public required string Url { get; set; }
    public required string PreviewImageUrl { get; set; }
    public required PollResponseVote[] Votes { get; set; }
    public required string? Choice { get; set; }
}

public class PollResponse
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required int OptionType { get; set; }
    public required PollResponseOption[] Options { get; set; }
    public required CommentResponse[] Comments { get; set; }
}

public static class PollMapper
{
    public static PollResponseVote ToPollResponseVote(this Entities.Vote vote)
    {
        return new PollResponseVote
        {
            Person = vote.Person.Name ?? vote.Person.Email,
            Choice = vote.Choice
        };
    }

    public static PollResponseOption ToPollResponseOption(this Entities.Option option, Guid? userId)
    {
        return new PollResponseOption
        {
            Id = option.Id.ToString(),
            Text = option.Text,
            Description = option.Description,
            Url = option.Url,
            PreviewImageUrl = option.PreviewImageUrl,
            Votes = option.Votes.Select(v => v.ToPollResponseVote()).ToArray(),
            Choice = option.Votes.FirstOrDefault(v => v.Person.Id == userId)?.Choice
        };
    }

    public static PollResponse ToPollResponse(this Entities.Poll poll, Guid? userId)
    {
        return new PollResponse
        {
            Id = poll.Id.ToString(),
            Name = poll.Name,
            Description = poll.Description,
            OptionType = (int)poll.OptionType,
            Options = poll.Options.OrderBy(o => o.Created).Select(o => o.ToPollResponseOption(userId)).ToArray(),
            Comments = poll.Comments
                .OrderBy(c => c.Created)
                .Select(c => c.ToCommentResponse())
                .ToArray()
        };
    }
}
