using Finder.Business.Project.Entities;

namespace Finder.Business.Project.Api.Requests;

public class UpdatePollRequest
{
    public required string Name { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime? CloseDate { get; set; }
    public OptionType? OptionType { get; set; }

    /// <summary>The version the client edited. Omitted = last write wins (older clients).</summary>
    public int? Version { get; set; }
}
