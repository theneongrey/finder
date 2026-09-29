using Finder.Business.Feedback.Entities;

namespace Finder.Business.Feedback.Api.Requests;

public record SubmitFeedbackRequest(FeedbackType Type, string? Comment, string? Page);
