namespace Finder.Business.Project.Api.Requests;

public class AddOptionToPollRequest
{
    public required Guid PollId { get; set; }
    public required string Text { get; set; }
    public required string Description { get; set; }
    public required string Url { get; set; }
}
