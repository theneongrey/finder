namespace Finder.Business.Project.Api.Requests;

public class TopicRequest
{
    public required Guid ProjectId { get; set; }
    public required string Name { get; set; }
}