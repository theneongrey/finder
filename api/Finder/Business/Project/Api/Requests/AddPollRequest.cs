
using Finder.Business.Project.Entities;

namespace Finder.Business.Project.Api.Requests;

public class AddPollRequest
{
    public required string ProjectId { get; set; }
    public required string Name { get; set; }
    public string Description { get; set; } = string.Empty;
    public required OptionType OptionType { get; set; }
}
