namespace Finder.Business.Permission.Api.Responses;

public class SharingContactResponse
{
    public required string Name { get; set; }
    public required string Email { get; set; }
    public string? Picture { get; set; }
    public required int ShareCount { get; set; }
}
