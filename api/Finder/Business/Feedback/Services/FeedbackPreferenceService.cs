using Finder.Business.Feedback.Entities;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Feedback.Services;

public class FeedbackPreferenceService(AppDbContext dbContext, UserService userService)
{
    public async Task<Result<FeedbackPreference>> GetPreference()
    {
        var userId = userService.GetUserId();
        if (!userId.HasValue)
        {
            return Result<FeedbackPreference>.Fail(401);
        }

        var preference = await dbContext.FeedbackPreferences.AsNoTracking()
            .SingleOrDefaultAsync(p => p.PersonId == userId.Value);

        // No row yet means the user never changed the default: the button is shown.
        return Result<FeedbackPreference>.Success(preference ?? new FeedbackPreference { PersonId = userId.Value });
    }

    public async Task<Result<FeedbackPreference>> UpdatePreference(bool buttonHidden)
    {
        var userId = userService.GetUserId();
        if (!userId.HasValue)
        {
            return Result<FeedbackPreference>.Fail(401);
        }

        var preference = await dbContext.FeedbackPreferences.SingleOrDefaultAsync(p => p.PersonId == userId.Value);
        if (preference is not null)
        {
            preference.ButtonHidden = buttonHidden;
            await dbContext.SaveChangesAsync();
            return Result<FeedbackPreference>.Success(preference);
        }

        preference = new FeedbackPreference { PersonId = userId.Value, ButtonHidden = buttonHidden };
        dbContext.FeedbackPreferences.Add(preference);
        try
        {
            await dbContext.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // A concurrent request inserted the row first (PK violation): update that row instead.
            dbContext.Entry(preference).State = EntityState.Detached;
            var updated = await dbContext.FeedbackPreferences
                .Where(p => p.PersonId == userId.Value)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(p => p.ButtonHidden, buttonHidden)
                    .SetProperty(p => p.Edited, DateTime.UtcNow));
            if (updated == 0)
            {
                // No row to fall back to, so the failure wasn't a lost insert race.
                throw;
            }
        }

        return Result<FeedbackPreference>.Success(preference);
    }
}
