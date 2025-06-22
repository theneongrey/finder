using Finder.Business.Permission.Entities;

namespace Finder.Business.Permission.Api.Requests;

public class UpdatePermissionRequest
{
    public required string Email { get; set; }
    public required PermissionType PermissionType { get; set; }
}