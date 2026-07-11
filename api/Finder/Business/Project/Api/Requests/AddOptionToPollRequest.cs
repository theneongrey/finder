namespace Finder.Business.Project.Api.Requests;

public class AddOptionToPollRequest
{
    public required string PollId { get; set; }
    public required string Text { get; set; }
    public string Description { get; set; } = string.Empty;
    public OptionMetaRequest? Meta { get; set; }
}
