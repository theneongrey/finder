using Finder.Business.Project.Entities;

namespace Finder.Business.Project.Api.Requests;

public class AddOptionToTopicRequest
{
    public required Guid TopicId { get; set; }
    public required string Text { get; set; }
    public required string Description { get; set; }
    public required string Url { get; set; }
    public required string PreviewImageUrl { get; set; }
}