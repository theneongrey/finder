using Finder.Business.Feedback.Entities;

namespace Finder.Business.Feedback.Api.Responses;

public class FeedbackPreferenceResponse
{
    public bool ButtonHidden { get; set; }

    /// <summary>Set while feedback is disabled after a scripted burst; null otherwise.</summary>
    public DateTime? FeedbackDisabledUntil { get; set; }
}

public static class FeedbackPreferenceMapper
{
    public static FeedbackPreferenceResponse ToFeedbackPreferenceResponse(this FeedbackPreference preference, DateTime now) => new()
    {
        ButtonHidden = preference.ButtonHidden,
        // An expired lock is no longer relevant to the client.
        FeedbackDisabledUntil = preference.FeedbackDisabledUntil > now
            ? DateTime.SpecifyKind(preference.FeedbackDisabledUntil.Value, DateTimeKind.Utc)
            : null
    };
}
