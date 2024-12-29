using Finder.Business.Auth.Entities;
using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public class Vote : BaseEntity
{
    public required Guid Id { get; set; }
    
    public required Option Option { get; set; }
    public required Person Person { get; set; }
}