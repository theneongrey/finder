using Finder.Business.Auth.Entities;
using Finder.Business.Shared.Entities;

namespace Finder.Business.Feedback.Entities;

/// <summary>Per-person feedback preferences. A missing row means the defaults apply (button shown).</summary>
public class FeedbackPreference : BaseEntity
{
    public Guid PersonId { get; set; }
    public bool ButtonHidden { get; set; }
    public Person Person { get; set; } = null!;
}
