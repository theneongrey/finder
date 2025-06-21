using Finder.Business.Project.Entities;

namespace Finder.Business.Project.Api.Requests;

public class AddOptionToTopicRequest
{
    public required Guid TopicId { get; set; }
    public required string Text { get; set; }
    public required OptionType OptionType { get; set; }
}