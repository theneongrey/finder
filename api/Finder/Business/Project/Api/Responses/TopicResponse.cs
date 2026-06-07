namespace Finder.Business.Project.Api.Responses;

public class TopicResponseVote
{
    public required string Person { get; set; }
    public required string Choice { get; set; }
}

public class TopicResponseOption
{
    public required string Id { get; set; }
    public required string Text { get; set; }
    public required TopicResponseVote[] Votes { get; set; }
    public required string? Choice { get; set; }
}

public class TopicResponse
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required int OptionType { get; set; }
    public required TopicResponseOption[] Options { get; set; }
}

public static class TopicMapper
{
    public static TopicResponseVote ToTopicResponseVote(this Entities.Vote vote)
    {
        return new TopicResponseVote
        {
            Person = vote.Person.Name ?? vote.Person.Email,
            Choice = vote.Choice
        };
    }

    public static TopicResponseOption ToTopicResponseOption(this Entities.Option option, Guid? userId)
    {
        return new TopicResponseOption
        {
            Id = option.Id.ToString(),
            Text = option.Text,
            Votes = option.Votes.Select(v => v.ToTopicResponseVote()).ToArray(),
            Choice = option.Votes.FirstOrDefault(v => v.Person.Id == userId)?.Choice
        };
    }

    public static TopicResponse ToTopicResponse(this Entities.Topic topic, Guid? userId)
    {
        return new TopicResponse
        {
            Id = topic.Id.ToString(),
            Name = topic.Name,
            OptionType = (int)topic.OptionType,
            Options = topic.Options.Select(o => o.ToTopicResponseOption(userId)).ToArray()
        };
    }
}
