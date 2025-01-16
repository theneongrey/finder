using Finder.Business.Project.Api.Requests;
using Finder.Business.Project.Entities;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Project.Services;

public class ProjectService
{
    private readonly AppDbContext _dbContext;
    private readonly UserService _userService;

    public ProjectService(AppDbContext dbContext, UserService userService)
    {
        _dbContext = dbContext;
        _userService = userService;
    }

    public async Task<List<Entities.Project>> GetAll()
    {
        return await _dbContext.Projects
            .Include(p => p.Topics)
            .Where(p => p.Creator.Id == _userService.GetUserId()).ToListAsync();
    }

    public async Task<Result<Entities.Project>> Create(string projectName)
    {
        var user = await _userService.GetUser();
        if (!user.IsSuccess)
        {
            return Result<Entities.Project>.Fail(user.Code);
        }

        var project = new Entities.Project
        {
            Id = Guid.NewGuid(),
            Name = projectName,
            Creator = user.Payload!,
            Topics = [],
        };

        _dbContext.Projects.Add(project);
        await _dbContext.SaveChangesAsync();
        return Result<Entities.Project>.Success(project);
    }

    public async Task<Result<Entities.Project>> Update(Guid projectId, string projectName)
    {
        var projectToUpdate = await GetProjectOverview(projectId);
        if (projectToUpdate is null)
        {
            return Result<Entities.Project>.Fail(404);
        }

        projectToUpdate.Name = projectName;
        await _dbContext.SaveChangesAsync();
        return Result<Entities.Project>.Success(projectToUpdate);
    }

    public async Task<Result> Delete(Guid projectId)
    {
        var deletedProjects = await _dbContext.Projects
            .Where(p => p.Id == projectId && p.Creator.Id == _userService.GetUserId()).ExecuteDeleteAsync();

        if (deletedProjects == 0)
        {
            return Result.Fail(404);
        }

        await _dbContext.SaveChangesAsync();
        return Result.Success();
    }
    
    public async Task<Result<Entities.Project>> Get(Guid projectId)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Topics)
            .ThenInclude(t => t.Options)
            .ThenInclude(o => o.Choices)
            .ThenInclude(c => c.Votes)
            .Where(p => p.Id == projectId && p.Creator.Id == _userService.GetUserId()).SingleOrDefaultAsync();
        if (project == null)
        {
            return Result<Entities.Project>.Fail(404);
        }

        return Result<Entities.Project>.Success(project);
    }

    public async Task<Result<Entities.Project>> AddTopic(AddTopicRequest topicRequest, string name)
    {
        var projectResult = await GetProjectOverview(topicRequest.ProjectId);
        if (projectResult == null)
        {
            return Result<Entities.Project>.Fail(404);
        }

        var topic = new Topic
        {
            Id = Guid.NewGuid(),
            Name = name,
            Project = projectResult,
            Options = []
        };

        foreach (var requestOption in topicRequest.Options)
        {
            var option = new Option
            {
                Id = Guid.NewGuid(),
                Text = requestOption.Text,
                OptionType = requestOption.OptionType,
                Topic = topic,
                Choices = []
            };
            option.Choices = GetChoicesByType(option.OptionType, option);
            topic.Options.Add(option); 
        }
        
        _dbContext.Topics.Add(topic);
        
        await _dbContext.SaveChangesAsync();
        return Result<Entities.Project>.Success(projectResult);
    }

    private List<Choice> GetChoicesByType(OptionType type, Option parent)
    {
        return type switch
        {
            OptionType.Rating =>
            [
                new Choice { Id = Guid.NewGuid(), Option = parent, Text = "Yes", Votes = [] },
                new Choice { Id = Guid.NewGuid(), Option = parent, Text = "No", Votes = [] }
            ],
            OptionType.YesNo =>
            [
                new Choice { Id = Guid.NewGuid(), Option = parent, Text = "1", Votes = [] },
                new Choice { Id = Guid.NewGuid(), Option = parent, Text = "2", Votes = [] },
                new Choice { Id = Guid.NewGuid(), Option = parent, Text = "3", Votes = [] },
                new Choice { Id = Guid.NewGuid(), Option = parent, Text = "4", Votes = [] },
                new Choice { Id = Guid.NewGuid(), Option = parent, Text = "5", Votes = [] }
            ],
            _ => throw new ArgumentOutOfRangeException(nameof(type), type, null)
        };
    }
    
    private async Task<Entities.Project?> GetProjectOverview(Guid projectId)
    {
        return await _dbContext.Projects
            .Include(p => p.Topics)
            .Where(p => p.Id == projectId && p.Creator.Id == _userService.GetUserId())
            .SingleOrDefaultAsync();
    }
}