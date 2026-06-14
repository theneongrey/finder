namespace Finder.Business.Project.Api.Requests;

public class AddCommentRequest
{
    public required Guid TopicId { get; set; }
    public required string Content { get; set; }
}
