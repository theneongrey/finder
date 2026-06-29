
using Finder.Business.Project.Entities;

namespace Finder.Business.Project.Api.Requests;

public class AddPollRequest
{
    public required Guid ProjectId { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required OptionType OptionType { get; set; }
}
