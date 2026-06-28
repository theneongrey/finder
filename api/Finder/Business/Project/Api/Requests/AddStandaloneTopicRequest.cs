using Finder.Business.Project.Entities;

namespace Finder.Business.Project.Api.Requests;

public class AddStandaloneTopicRequest
{
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required OptionType OptionType { get; init; }
}
