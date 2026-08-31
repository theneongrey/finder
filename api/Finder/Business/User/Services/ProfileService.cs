using Finder.Business.Auth.Entities;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.User.Services;

public class ProfileService
{
    private readonly AppDbContext _dbContext;
    private readonly UserService _userService;

    public ProfileService(AppDbContext dbContext, UserService userService)
    {
        _dbContext = dbContext;
        _userService = userService;
    }

    public async Task<Result<Person?>> UpdateProfile(string name, string language)
    {
        var userId = _userService.GetUserId();
        if (!userId.HasValue)
        {
            return Result<Person?>.Fail();
        }

        var person = await _dbContext.Persons.SingleOrDefaultAsync(p => p.Id == userId);
        if (person == null)
        {
            return Result<Person?>.Fail();
        }

        person.Name = name.StripHtml();
        person.Language = language;
        await _dbContext.SaveChangesAsync();
        return Result<Person?>.Success(person);
    }
}
