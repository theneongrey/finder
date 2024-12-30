using System.Security.Claims;
using Finder.Business.Auth.Entities;
using Finder.Business.Shared;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Auth.Services;

public class PersonService
{
    private readonly AppDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PersonService(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor)
    {
        _dbContext = dbContext;
        _httpContextAccessor = httpContextAccessor;
    }
    
    public async Task<Result<Person>> GetPerson()
    {
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
        
        return Result<Person>.Success(person);
    }

    public async Task<Result<Person?>> SetName(string name)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
        {
            return Result<Person?>.Fail();
        }
        
        var person = await _dbContext.Persons.SingleOrDefaultAsync(p => p.Id == userId);
        if (person == null)
        {
            return Result<Person?>.Fail();
        }
        
        person.Name = name;
        await _dbContext.SaveChangesAsync();
        return Result<Person?>.Success(person);
    }

    private Guid? GetUserId()
    {
        var id = _httpContextAccessor.HttpContext!.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (id == null)
        {
            return null;
        }       
        
        return Guid.Parse(id);
    }
}