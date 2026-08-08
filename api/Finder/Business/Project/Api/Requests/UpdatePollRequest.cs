namespace Finder.Business.Project.Api.Requests;

public class UpdatePollRequest
{
    public required string Name { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime? CloseDate { get; set; }
}
