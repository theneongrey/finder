using Finder.Business.Feedback.Setup;

namespace Finder.Business.Feedback.Api.Responses;

public class FeedbackConfigResponse
{
    public bool ShowButton { get; set; }
}

public static class FeedbackConfigMapper
{
    public static FeedbackConfigResponse ToFeedbackConfigResponse(this FeedbackOptions options) => new()
    {
        ShowButton = options.ShowButton
    };
}
