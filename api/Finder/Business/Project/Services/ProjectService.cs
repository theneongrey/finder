using Finder.Business.Permission.Entities;
using Finder.Business.Permission.Services;
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
    private readonly PermissionService _permissionService;

    private Guid? UserId => _userService.GetUserId();

    public ProjectService(AppDbContext dbContext, UserService userService, PermissionService permissionService)
    {
        _dbContext = dbContext;
        _userService = userService;
        _permissionService = permissionService;
    }

    public async Task<List<Entities.Project>> GetAll()
    {
        return await _dbContext.Projects
            .Include(p => p.Topics)
            .Include(p => p.Creator)
            .Include(p => p.Permissions)
            .Where(p => p.Creator.Id == UserId || p.Permissions.Any(permission => permission.Person.Id == UserId))
            .ToListAsync();
    }

    public async Task<Result<Entities.Project>> Create(string name, string description)
    {
        var userRequest = await _userService.GetUser();
        if (!userRequest.IsSuccess)
        {
            return Result<Entities.Project>.Fail(userRequest.Code);
        }

        var project = new Entities.Project
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            Creator = userRequest.Payload!,
            VisibilityType = VisibilityType.VisibleForSelectedOnly
        };

        _dbContext.Projects.Add(project);
        await _dbContext.SaveChangesAsync();
        return Result<Entities.Project>.Success(project);
    }

    public async Task<Result<Entities.Project>> Update(Guid projectId, string projectName, string projectDescription)
    {
        var projectToUpdate = await _dbContext.Projects
            .Include(p => p.Permissions)
            .Include(p => p.Creator)
            .Where(p => p.Id == projectId &&
                        (p.Creator.Id == UserId || p.Permissions.Any(permission =>
                            permission.Person.Id == UserId && permission.PermissionType == PermissionType.Owner)))
            .SingleOrDefaultAsync();

        if (projectToUpdate is null)
        {
            return Result<Entities.Project>.Fail(404);
        }

        projectToUpdate.Name = projectName;
        projectToUpdate.Description = projectDescription;
        await _dbContext.SaveChangesAsync();
        return Result<Entities.Project>.Success(projectToUpdate);
    }

    public async Task<Result> Delete(Guid projectId)
    {
        var deletedProjects = await _dbContext.Projects
            .Where(p => p.Id == projectId && (p.Creator.Id == UserId || p.Permissions.Any(permission =>
                permission.Person.Id == UserId && permission.PermissionType == PermissionType.Owner)))
            .ExecuteDeleteAsync();

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
            .Include(p => p.Creator)
            .Include(p => p.Permissions)
            .ThenInclude(p => p.Person)
            .Include(p => p.Topics)
            .ThenInclude(t => t.Options)
            .Where(p => p.Id == projectId && (p.VisibilityType == VisibilityType.VisibleForEverbody || p.Creator.Id == UserId ||
                                              p.Permissions.Any(permission => permission.PersonKey == UserId)))
            .SingleOrDefaultAsync();
        if (project == null)
        {
            return Result<Entities.Project>.Fail(404);
        }

        // person was not explicitly permitted, but can see it, because project is open for all
        // add person to permissions, so that it can be tracked who has seen this project
        if (project.Permissions.All(permission => permission.PersonKey != UserId))
        {
            var user = await _userService.GetUser();
            await _permissionService.AddOrUpdatePermissionForUser(user.Payload!, false, project, PermissionType.Voter, true);
        }

        return Result<Entities.Project>.Success(project);
    }

    public async Task<Result<Topic>> AddTopic(AddTopicRequest topicRequest)
    {
        var projectResult = await _dbContext.Projects
            .Include(p => p.Topics)
            .Where(p => p.Id == topicRequest.ProjectId && (p.VisibilityType == VisibilityType.VisibleForEverbody ||
                                                           p.Creator.Id == UserId ||
                                                           p.Permissions.Any(permission =>
                                                               permission.Person.Id == UserId &&
                                                               permission.PermissionType >= PermissionType.Maintainer)))
            .SingleOrDefaultAsync();

        if (projectResult == null)
        {
            return Result<Topic>.Fail(404);
        }

        var topic = new Topic
        {
            Id = Guid.NewGuid(),
            OptionType = topicRequest.OptionType,
            Name = topicRequest.Name,
            Project = projectResult
        };

        _dbContext.Topics.Add(topic);

        await _dbContext.SaveChangesAsync();
        return Result<Topic>.Success(topic);
    }

    public async Task<Result> DeleteTopic(Guid topicId)
    {
        var deletedTopics = await _dbContext.Topics
            .Where(t => t.Id == topicId && (t.Project.VisibilityType == VisibilityType.VisibleForEverbody ||
                                            t.Project.Creator.Id == UserId ||
                                            t.Project.Permissions.Any(permission =>
                                                permission.Person.Id == UserId &&
                                                permission.PermissionType >= PermissionType.Maintainer)))
            .ExecuteDeleteAsync();

        if (deletedTopics == 0)
        {
            return Result.Fail(404);
        }

        await _dbContext.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result<Topic>> GetTopic(Guid topicId)
    {
        var topic = await _dbContext.Topics
            .Include(t => t.Options)
            .ThenInclude(o => o.Votes)
            .ThenInclude(v => v.Person)
            .Where(t => t.Id == topicId && (
                t.Project.VisibilityType == VisibilityType.VisibleForEverbody ||
                t.Project.Creator.Id == UserId ||
                t.Project.Permissions.Any(permission => permission.PersonKey == UserId)))
            .SingleOrDefaultAsync();

        if (topic is null)
        {
            return Result<Topic>.Fail(404);
        }

        return Result<Topic>.Success(topic);
    }

    public async Task<Result<Option>> AddOptionToTopic(AddOptionToTopicRequest topicRequest)
    {
        var topic = await _dbContext.Topics
            .Where(t => t.Id == topicRequest.TopicId && (t.Project.VisibilityType == VisibilityType.VisibleForEverbody ||
                                                         t.Project.Creator.Id == UserId ||
                                                         t.Project.Permissions.Any(permission =>
                                                             permission.Person.Id == UserId &&
                                                             permission.PermissionType >= PermissionType.Maintainer)))
            .FirstOrDefaultAsync();

        if (topic is null)
        {
            return Result<Option>.Fail(404);
        }

        var option = new Option
        {
            Id = Guid.NewGuid(),
            Text = topicRequest.Text,
            Topic = topic
        };
        topic.Options.Add(option);

        _dbContext.Options.Add(option);

        await _dbContext.SaveChangesAsync();
        return Result<Option>.Success(option);
    }

    public async Task<Result> DeleteOption(Guid optionId)
    {
        var deletedOption = await _dbContext.Options
            .Where(o => o.Id == optionId && (o.Topic.Project.VisibilityType == VisibilityType.VisibleForEverbody ||
                                             o.Topic.Project.Creator.Id == UserId ||
                                             o.Topic.Project.Permissions.Any(permission =>
                                                 permission.Person.Id == UserId &&
                                                 permission.PermissionType >= PermissionType.Maintainer)))
            .ExecuteDeleteAsync();

        if (deletedOption == 0)
        {
            return Result.Fail(404);
        }

        await _dbContext.SaveChangesAsync();
        return Result.Success();
    }
}