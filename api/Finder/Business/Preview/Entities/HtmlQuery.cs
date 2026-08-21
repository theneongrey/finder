using Finder.Business.Shared.Entities;

namespace Finder.Business.Preview.Entities;

public enum QueryType
{
    Image,
    Description
}

public class HtmlQuery : BaseEntity
{
    public required Guid Id { get; init; }
    public required string BaseUrl { get; init; }
    public required string Query { get; init; }
    public required QueryType Type { get; init; }
}