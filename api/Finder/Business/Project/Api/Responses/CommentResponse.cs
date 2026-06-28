namespace Finder.Business.Project.Api.Responses;

public class CommentAuthorResponse
{
    public required string Name { get; set; }
    public required string Picture { get; set; }
}

public class CommentResponse
{
    public required string Id { get; set; }
    public required string Content { get; set; }
    public required CommentAuthorResponse Author { get; set; }
    public required DateTime Created { get; set; }
    public string? Quote { get; set; }
}

public static class CommentMapper
{
    public static CommentResponse ToCommentResponse(this Entities.Comment comment)
    {
        return new CommentResponse
        {
            Id = comment.Id.ToString(),
            Content = comment.Content,
            Author = new CommentAuthorResponse
            {
                Name = comment.Person.Name ?? "Unknown",
                Picture = comment.Person.Picture,
            },
            Created = comment.Created,
            Quote = comment.Quote
        };
    }
}
