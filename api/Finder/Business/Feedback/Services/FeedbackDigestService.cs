using System.Globalization;
using System.Net;
using System.Text;
using Finder.Business.Feedback.Entities;
using Finder.Business.Feedback.Setup;
using Finder.Business.Shared.Services;
using Finder.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Finder.Business.Feedback.Services;

/// <summary>
/// Sends all pending feedback as one digest mail once the daily digest time has passed.
/// Safe to call repeatedly: it only sends rows submitted before today's cutoff that haven't been
/// sent yet, so a missed run (e.g. the app was down at 17:00) is caught up by the next one.
/// </summary>
public class FeedbackDigestService(
    AppDbContext dbContext,
    MailService mailService,
    LanguageService languageService,
    TimeProvider timeProvider,
    IOptions<FeedbackOptions> feedbackOptions,
    ILogger<FeedbackDigestService> logger)
{
    /// <summary>Sent rows are kept this long, then deleted. The limits only look back 24 hours.</summary>
    public static readonly TimeSpan Retention = TimeSpan.FromDays(2);

    private readonly FeedbackOptions _feedbackOptions = feedbackOptions.Value;

    public async Task SendPendingDigest(CancellationToken cancellationToken = default)
    {
        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        await PurgeSentSubmissions(nowUtc, cancellationToken);

        var timeZone = TimeZoneInfo.FindSystemTimeZoneById(_feedbackOptions.DigestTimeZone);
        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, timeZone);
        var cutoffLocal = nowLocal.Date + _feedbackOptions.DigestTime.ToTimeSpan();
        if (nowLocal < cutoffLocal)
        {
            return;
        }

        var cutoffUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(cutoffLocal, DateTimeKind.Unspecified), timeZone);
        var pending = await dbContext.FeedbackSubmissions
            .Include(s => s.Person)
            .Where(s => s.SentAt == null && s.SubmittedAt < cutoffUtc)
            .OrderBy(s => s.SubmittedAt)
            .ToListAsync(cancellationToken);

        if (pending.Count == 0)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(_feedbackOptions.RecipientEmail))
        {
            logger.LogError("{Count} feedback submissions are pending but Feedback:RecipientEmail is not configured", pending.Count);
            return;
        }

        var date = nowLocal.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var count = pending.Count.ToString(CultureInfo.InvariantCulture);
        var mail = new Mail(
            $"{languageService.Get("feedback.digest.subject")} - {date} ({count})",
            "Votean Feedback",
            _feedbackOptions.RecipientEmail,
            new MailTemplate("feedback-digest", "en",
                new Dictionary<string, string>
                {
                    ["count"] = count,
                    ["date"] = date
                },
                string.Format(CultureInfo.InvariantCulture, languageService.Get("feedback.digest.preheader"), count),
                new Dictionary<string, string>
                {
                    ["items"] = BuildItems(pending, timeZone)
                })
        );

        try
        {
            await mailService.SendAsync(mail);
        }
        catch (Exception ex)
        {
            // Rows stay pending, so the next check retries.
            logger.LogError(ex, "Error while sending the feedback digest");
            return;
        }

        foreach (var submission in pending)
        {
            submission.SentAt = nowUtc;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task PurgeSentSubmissions(DateTime nowUtc, CancellationToken cancellationToken)
    {
        var threshold = nowUtc - Retention;
        await dbContext.FeedbackSubmissions
            .Where(s => s.SentAt != null && s.SentAt < threshold)
            .ExecuteDeleteAsync(cancellationToken);
    }

    // Each value is HTML-encoded here because the block is inserted as a raw HTML variable.
    private string BuildItems(IEnumerable<FeedbackSubmission> submissions, TimeZoneInfo timeZone)
    {
        var html = new StringBuilder();
        foreach (var submission in submissions)
        {
            var submittedUtc = DateTime.SpecifyKind(submission.SubmittedAt, DateTimeKind.Utc);
            var submittedLocal = TimeZoneInfo.ConvertTimeFromUtc(submittedUtc, timeZone);

            html.Append(string.Format(CultureInfo.InvariantCulture, ItemTemplate,
                Encode(submission.Type.ToString()),
                Encode(submission.Comment),
                Encode(submission.Person.Name ?? "-"),
                Encode(submission.Person.Email),
                Encode($"{submittedLocal.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture)} ({timeZone.Id})"),
                Encode(submission.Page)));
        }

        return html.ToString();
    }

    private static string Encode(string value) => WebUtility.HtmlEncode(value);

    private const string MetaRow =
        """
        <tr>
            <td style="padding:4px 16px 4px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:bold;color:#a39e96;white-space:nowrap;vertical-align:top;">{0}</td>
            <td style="padding:4px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#3a3833;word-break:break-word;">{1}</td>
        </tr>
        """;

    // {0} type, {1} comment, {2} name, {3} email, {4} time, {5} page
    private static readonly string ItemTemplate =
        """
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-top:1px solid #ece7de;">
            <tbody>
            <tr>
                <td style="padding-top:24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tbody>
                        <tr>
                            <td bgcolor="#e7f2f3" style="background-color:#e7f2f3;border-radius:99px;padding:6px 14px;font-family:Helvetica,Arial,sans-serif;font-size:11.5px;font-weight:bold;letter-spacing:.6px;color:#1f7a8c;text-transform:uppercase;">{0}</td>
                        </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding-top:14px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tbody>
                        <tr>
                            <td bgcolor="#faf8f4" style="background-color:#faf8f4;border:1px solid #ece7de;border-left:3px solid #1f7a8c;border-radius:8px;padding:16px 20px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#3a3833;white-space:pre-wrap;word-break:break-word;">{1}</td>
                        </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding-top:12px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tbody>
        """
        + MetaRow.Replace("{0}", "Name").Replace("{1}", "{2}")
        + MetaRow.Replace("{0}", "Email").Replace("{1}", "{3}")
        + MetaRow.Replace("{0}", "Time").Replace("{1}", "{4}")
        + MetaRow.Replace("{0}", "Screen").Replace("{1}", "{5}")
        + """
                        </tbody>
                    </table>
                </td>
            </tr>
            </tbody>
        </table>
        """;
}
