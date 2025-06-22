using Finder.Business.Project.Entities;

namespace Finder.Business.Permission.Api.Requests;

public class UpdatePermissionTypeRequest
{
    public required VisibilityType Type { get; set; }
}