using System.Globalization;
using Finder.Business.Feedback.Entities;
using Finder.Business.Feedback.Setup;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Microsoft.Extensions.Options;

namespace Finder.Business.Feedback.Services;

public class FeedbackService(
    UserService userService,
    MailService mailService,
    LanguageService languageService,
    IOptions<FeedbackOptions> feedbackOptions,
    ILogger<FeedbackService> logger)
{
    public const int MaxCommentLength = 2000;
    public const int MaxPageLength = 500;

    private readonly FeedbackOptions _feedbackOptions = feedbackOptions.Value;

    public async Task<Result> SubmitFeedback(FeedbackType type, string? comment, string? page)
    {
        var cleanComment = comment?.StripHtml().Trim() ?? string.Empty;
        var cleanPage = page?.Trim() ?? string.Empty;

        if (!Enum.IsDefined(type)
            || cleanComment.Length == 0 || cleanComment.Length > MaxCommentLength
            || cleanPage.Length == 0 || cleanPage.Length > MaxPageLength)
        {
            return Result.Fail(400);
        }

        var userResult = await userService.GetUser();
        if (!userResult.IsSuccess || userResult.Payload is null)
        {
            return Result.Fail(401);
        }

        if (string.IsNullOrWhiteSpace(_feedbackOptions.RecipientEmail))
        {
            logger.LogError("Feedback submitted but Feedback:RecipientEmail is not configured");
            return Result.Fail(502);
        }

        var person = userResult.Payload;
        var typeName = type.ToString();
        var timestamp = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd HH:mm 'UTC'", CultureInfo.InvariantCulture);

        // Plain Variables are HTML-encoded by MailTemplateService, so user input can't inject markup.
        // Placeholders are replaced in insertion order; the free-text comment goes last so a
        // "{{…}}" typed into it isn't expanded with another field's value.
        var mail = new Mail(
            $"{languageService.Get("feedback.subject")} - {typeName}",
            "Votean Feedback",
            _feedbackOptions.RecipientEmail,
            new MailTemplate("feedback", "en", new Dictionary<string, string>
            {
                ["type"] = typeName,
                ["name"] = person.Name ?? "-",
                ["email"] = person.Email,
                ["timestamp"] = timestamp,
                ["page"] = cleanPage,
                ["comment"] = cleanComment
            }, languageService.Get("feedback.preheader"))
        );

        try
        {
            await mailService.SendAsync(mail);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error while sending feedback mail");
            return Result.Fail(502);
        }

        return Result.Success(204);
    }
}
