namespace Finder.Business.Project.Api.Responses;

public class CommentResponse
{
    public required string Id { get; set; }
    public required string Content { get; set; }
    public required string Author { get; set; }
    public required DateTime Created { get; set; }
}

public static class CommentMapper
{
    public static CommentResponse ToCommentResponse(this Entities.Comment comment)
    {
        return new CommentResponse
        {
            Id = comment.Id.ToString(),
            Content = comment.Content,
            Author = comment.Person.Name ?? comment.Person.Email,
            Created = comment.Created
        };
    }
}
