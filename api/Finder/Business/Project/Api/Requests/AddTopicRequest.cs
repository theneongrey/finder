using Finder.Business.Project.Entities;

namespace Finder.Business.Project.Api.Requests;

public class AddTopicRequestOption
{
    public required string Text { get; set; }
    
    public required OptionType OptionType { get; set; }
}

public class AddTopicRequest
{
    public required Guid ProjectId { get; set; }
    public required string Name { get; set; }
    
    public required AddTopicRequestOption[] Options { get; set; }
    
}