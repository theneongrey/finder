using DnsClient;
using Finder.Business.Shared;

namespace Finder.Business.Auth.Services;

public class EmailValidationService
{
    private const string BlocklistUrl =
        "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/refs/heads/main/disposable_email_blocklist.conf";

    private static readonly TimeSpan BlocklistTtl = TimeSpan.FromDays(7);

    private record BlocklistSnapshot(HashSet<string> Domains, DateTime LoadedAt);

    private volatile BlocklistSnapshot? _snapshot;
    private readonly SemaphoreSlim _lock = new(1, 1);

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly LookupClient _lookupClient;
    private readonly ILogger<EmailValidationService> _logger;

    public EmailValidationService(IHttpClientFactory httpClientFactory, LookupClient lookupClient, ILogger<EmailValidationService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _lookupClient = lookupClient;
        _logger = logger;
    }

    public async Task<Result> ValidateEmailAsync(string email)
    {
        var atIndex = email.IndexOf('@');
        if (atIndex < 0)
        {
            return Result.Fail(400);
        }

        var domain = email[(atIndex + 1)..].ToLowerInvariant();

        var snapshot = await EnsureBlocklistAsync();
        if (snapshot.Domains.Contains(domain))
        {
            return Result.Fail(403);
        }

        var dnsResult = await _lookupClient.QueryAsync(domain, QueryType.MX);
        if (!dnsResult.Answers.MxRecords().Any())
        {
            return Result.Fail(403);
        }

        return Result.Success();
    }

    private async Task<BlocklistSnapshot> EnsureBlocklistAsync()
    {
        var current = _snapshot;
        if (current != null && DateTime.UtcNow - current.LoadedAt < BlocklistTtl)
        {
            return current;
        }

        await _lock.WaitAsync();
        try
        {
            // Double-check after acquiring the lock
            current = _snapshot;
            if (current != null && DateTime.UtcNow - current.LoadedAt < BlocklistTtl)
            {
                return current;
            }

            var fresh = await TryLoadBlocklistAsync();
            _snapshot = fresh;
            return fresh;
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task<BlocklistSnapshot> TryLoadBlocklistAsync()
    {
        try
        {
            var client = _httpClientFactory.CreateClient("EmailValidation");
            var content = await client.GetStringAsync(BlocklistUrl);

            var domains = content
                .Split('\n', StringSplitOptions.RemoveEmptyEntries)
                .Select(line => line.Trim())
                .Where(line => line.Length > 0 && !line.StartsWith('#'))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            _logger.LogInformation("Loaded disposable email blocklist with {Count} domains", domains.Count);
            return new BlocklistSnapshot(domains, DateTime.UtcNow);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load disposable email blocklist; keeping existing data");

            // Return the existing snapshot if available, otherwise an empty one.
            // Set LoadedAt to now so we don't hammer the URL on every request.
            var existing = _snapshot;
            return existing != null
                ? new BlocklistSnapshot(existing.Domains, DateTime.UtcNow)
                : new BlocklistSnapshot([], DateTime.UtcNow);
        }
    }
}
