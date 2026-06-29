namespace Finder.Business.Project.Api.Requests;

public class AddCommentRequest
{
    public required Guid PollId { get; set; }
    public required string Content { get; set; }
    public string? Quote { get; set; }
}
