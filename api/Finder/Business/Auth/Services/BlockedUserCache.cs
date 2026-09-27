using Finder.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Finder.Business.Auth.Services;

/// <summary>
/// Answers "is this person blocked?" for the cookie validation that runs on every authenticated
/// request. Lookups are cached briefly so a request doesn't cost an extra query each time.
/// </summary>
public class BlockedUserCache(IServiceScopeFactory scopeFactory, IMemoryCache cache)
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(1);

    public async Task<bool> IsBlocked(Guid personId)
    {
        return await cache.GetOrCreateAsync(CacheKey(personId), async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheDuration;

            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            return await dbContext.Persons.AsNoTracking()
                .Where(p => p.Id == personId)
                .Select(p => p.IsBlocked)
                .SingleOrDefaultAsync();
        });
    }

    /// <summary>Drops the cached value so a block takes effect on the person's next request.</summary>
    public void Invalidate(Guid personId) => cache.Remove(CacheKey(personId));

    private static string CacheKey(Guid personId) => $"blocked-user:{personId}";
}
