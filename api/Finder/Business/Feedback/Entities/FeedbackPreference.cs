using Finder.Business.Auth.Entities;
using Finder.Business.Shared.Entities;

namespace Finder.Business.Feedback.Entities;

/// <summary>Per-person feedback preferences. A missing row means the defaults apply (button shown).</summary>
public class FeedbackPreference : BaseEntity
{
    public Guid PersonId { get; set; }
    public bool ButtonHidden { get; set; }

    /// <summary>Set when a submission burst looked scripted; feedback is refused until then.</summary>
    public DateTime? FeedbackDisabledUntil { get; set; }

    /// <summary>How often a scripted burst was detected. Reaching the limit blocks the person.</summary>
    public int ScriptStrikes { get; set; }

    public Person Person { get; set; } = null!;
}
