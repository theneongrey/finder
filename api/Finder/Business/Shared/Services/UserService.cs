using System.Security.Claims;
using Finder.Business.Auth.Entities;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Shared.Services;

public class UserService
{
    private readonly AppDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly EmailValidationService _emailValidationService;
    private Guid? _cachedId;
    private Result<Person>? _cachedUser;

    public UserService(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor, EmailValidationService emailValidationService)
    {
        _dbContext = dbContext;
        _httpContextAccessor = httpContextAccessor;
        _emailValidationService = emailValidationService;
    }

    public async Task<Result<Person>> GetUser()
    {
        if (_cachedUser is not null)
        {
            return _cachedUser;
        }

        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Result<Person>.Fail();
        }

        var person = await _dbContext.Persons.SingleOrDefaultAsync(p => p.Id == userId);
        if (person == null)
        {
            return Result<Person>.Fail();
        }

        _cachedUser = Result<Person>.Success(person);

        return _cachedUser;
    }

    public async Task<Result<Person>> GetOrCreatePersonByEmail(string email, bool inviteAdminOnly)
    {
        var person = await _dbContext.Persons.SingleOrDefaultAsync(p => p.Email == email);

        if (person is null)
        {
            if (inviteAdminOnly && (await GetUser()).Payload?.Role != Role.Admin)
            {
                return Result<Person>.Fail(403);
            }

            var validationResult = await _emailValidationService.ValidateEmailAsync(email);
            if (!validationResult.IsSuccess)
            {
                return Result<Person>.Fail(validationResult.Code);
            }

            person = new Person
            {
                Id = Guid.NewGuid(),
                Email = email,
                Role = Role.Free,
                Language = "de"
            };
            _dbContext.Persons.Add(person);
        }

        return Result<Person>.Success(person);
    }

    public Guid? GetUserId()
    {
        if (_cachedId is not null)
        {
            return _cachedId;
        }

        var id = _httpContextAccessor.HttpContext!.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (id == null)
        {
            return null;
        }

        _cachedId = Guid.Parse(id);

        return _cachedId;
    }
}