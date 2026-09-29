using Finder.Business.Auth.Services;
using Finder.Business.Feedback.Entities;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Feedback.Services;

public enum FeedbackLimitResult
{
    Allowed,

    /// <summary>Feedback is disabled for this person after an earlier scripted burst.</summary>
    Disabled,

    /// <summary>The 30-minute or daily limit is reached.</summary>
    RateLimited,

    /// <summary>This submission completed a scripted burst: a strike was recorded and feedback disabled.</summary>
    ScriptDetected
}

/// <summary>
/// Per-person submission limits for feedback. Only stored submissions count, so rejected attempts
/// don't use up the allowance.
/// </summary>
public class FeedbackLimitService(
    AppDbContext dbContext,
    TimeProvider timeProvider,
    BlockedUserCache blockedUserCache,
    ILogger<FeedbackLimitService> logger)
{
    public static readonly TimeSpan BurstWindow = TimeSpan.FromSeconds(30);
    public const int BurstCount = 3;

    public static readonly TimeSpan ShortWindow = TimeSpan.FromMinutes(30);
    public const int ShortLimit = 5;

    public static readonly TimeSpan DailyWindow = TimeSpan.FromHours(24);
    public const int DailyLimit = 10;

    public static readonly TimeSpan DisableDuration = TimeSpan.FromHours(24);
    public const int StrikesUntilBlock = 3;

    public async Task<FeedbackLimitResult> Check(Guid personId)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;

        var preference = await dbContext.FeedbackPreferences.SingleOrDefaultAsync(p => p.PersonId == personId);
        if (preference?.FeedbackDisabledUntil > now)
        {
            return FeedbackLimitResult.Disabled;
        }

        // At most DailyLimit rows can be in this window, so loading the timestamps is cheap.
        var windowStart = now - DailyWindow;
        var recent = await dbContext.FeedbackSubmissions.AsNoTracking()
            .Where(s => s.PersonId == personId && s.SubmittedAt > windowStart)
            .Select(s => s.SubmittedAt)
            .ToListAsync();

        // This submission would be the BurstCount-th inside the burst window.
        if (recent.Count(t => t > now - BurstWindow) >= BurstCount - 1)
        {
            await RecordStrike(personId, preference, now);
            return FeedbackLimitResult.ScriptDetected;
        }

        if (recent.Count(t => t > now - ShortWindow) >= ShortLimit || recent.Count >= DailyLimit)
        {
            return FeedbackLimitResult.RateLimited;
        }

        return FeedbackLimitResult.Allowed;
    }

    private async Task RecordStrike(Guid personId, FeedbackPreference? preference, DateTime now)
    {
        if (preference is null)
        {
            preference = new FeedbackPreference { PersonId = personId };
            dbContext.FeedbackPreferences.Add(preference);
        }

        preference.ScriptStrikes++;
        preference.FeedbackDisabledUntil = now + DisableDuration;

        var block = preference.ScriptStrikes >= StrikesUntilBlock;
        if (block)
        {
            var person = await dbContext.Persons.SingleAsync(p => p.Id == personId);
            person.IsBlocked = true;
            person.BlockedAt = now;
        }

        await dbContext.SaveChangesAsync();

        if (block)
        {
            blockedUserCache.Invalidate(personId);
            logger.LogWarning("Person {PersonId} blocked after {Strikes} scripted feedback bursts", personId, preference.ScriptStrikes);
        }
        else
        {
            logger.LogWarning("Scripted feedback burst from person {PersonId} (strike {Strikes}); feedback disabled until {Until}",
                personId, preference.ScriptStrikes, preference.FeedbackDisabledUntil);
        }
    }
}
