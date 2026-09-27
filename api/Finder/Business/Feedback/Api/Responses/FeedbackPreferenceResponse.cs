using Finder.Business.Feedback.Entities;

namespace Finder.Business.Feedback.Api.Responses;

public class FeedbackPreferenceResponse
{
    public bool ButtonHidden { get; set; }
}

public static class FeedbackPreferenceMapper
{
    public static FeedbackPreferenceResponse ToFeedbackPreferenceResponse(this FeedbackPreference preference) => new()
    {
        ButtonHidden = preference.ButtonHidden
    };
}
