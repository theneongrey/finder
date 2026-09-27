namespace Finder.Business.Project.Api.Requests;

public class UpdateOptionRequest
{
    public required string Text { get; set; }
    public string Description { get; set; } = string.Empty;
    public OptionMetaRequest? Meta { get; set; }

    /// <summary>The version the client edited. Omitted = last write wins (older clients).</summary>
    public int? Version { get; set; }
}
