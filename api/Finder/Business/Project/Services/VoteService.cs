using Finder.Business.Project.Entities;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Project.Services;

public class VoteService
{
    private readonly AppDbContext _dbContext;
    private readonly UserService _userService;

    private Guid? UserId => _userService.GetUserId();

    public VoteService(AppDbContext dbContext, UserService userService)
    {
        _dbContext = dbContext;
        _userService = userService;
    }

    public async Task<Result> Vote(Guid optionId, string choice)
    {
        var option = await _dbContext.Options
            .Include(option => option.Votes)
            .ThenInclude(vote => vote.Person)
            .FirstOrDefaultAsync(o =>
                o.Id == optionId && (o.Poll.Project.Creator.Id == UserId ||
                                     o.Poll.Project.Permissions.Any(p => p.PersonKey == UserId)));

        if (option is null)
        {
            return Result.Fail(404);
        }

        var user = (await _userService.GetUser()).Payload!;
        var vote = option.Votes.Find(v => v.Person.Id == UserId);
        if (vote is null)
        {
            var newVote = new Vote
            {
                Id = Guid.NewGuid(),
                Choice = choice,
                Person = user,
                Option = option
            };
            option.Votes.Add(newVote);
            _dbContext.Votes.Add(newVote);
        }
        else
        {
            vote.Choice = choice;
        }
        
        await _dbContext.SaveChangesAsync();
        
        return Result.Success();
    }
}