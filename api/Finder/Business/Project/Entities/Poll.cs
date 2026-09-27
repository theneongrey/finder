using Finder.Business.Shared.Entities;

namespace Finder.Business.Project.Entities;

public enum OptionType
{
    YesNo = 0,
    Rating = 1,
    Date = 2,
    Weekday = 3,
    DateRange = 4,
    Time = 5,
    TimeRange = 6,
    DateWithTime = 7,
    WeekdayWithTime = 8,
    DateRangeWithTime = 9
}

public class Poll : BaseEntity
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required OptionType OptionType { get; set; }
    public DateTime? CloseDate { get; set; }

    /// <summary>
    /// Optimistic-concurrency token: bumped on every edit. Clients echo the version they edited;
    /// a mismatch means someone else changed it first (412).
    /// </summary>
    public int Version { get; set; }

    public required Project Project { get; set; }
    public List<Option> Options { get; set; } = [];
    public List<Comment> Comments { get; set; } = [];
    public List<PollStatusChange> StatusChanges { get; set; } = [];
}
