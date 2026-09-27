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
        if (preference is null)
        {
            preference = new FeedbackPreference { PersonId = userId.Value };
            dbContext.FeedbackPreferences.Add(preference);
        }

        preference.ButtonHidden = buttonHidden;
        await dbContext.SaveChangesAsync();

        return Result<FeedbackPreference>.Success(preference);
    }
}
