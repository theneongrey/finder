using System.Text.Json.Serialization;

namespace Finder.Business.Feedback.Entities;

[JsonConverter(typeof(JsonStringEnumConverter<FeedbackType>))]
public enum FeedbackType
{
    Bug,
    Idea,
    Other
}
