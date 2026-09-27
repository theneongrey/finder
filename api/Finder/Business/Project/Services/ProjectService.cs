using Finder.Business.Permission.Entities;
using Finder.Business.Permission.Services;
using Finder.Business.Project.Entities;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Database;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Project.Services;

/// <summary>
/// Project-level operations (listing, CRUD, visibility, favorites). Poll, option and comment
/// operations live in <see cref="PollService"/>, <see cref="OptionService"/> and
/// <see cref="CommentService"/>; voting in <see cref="VoteService"/>.
/// </summary>
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
            .Include(p => p.Polls)
            .Include(p => p.Creator)
            .Include(p => p.Permissions)
            .ThenInclude(p => p.Person)
            .Where(p => !p.IsStandalone &&
                        (p.Creator.Id == UserId || p.Permissions.Any(permission => permission.Person.Id == UserId)))
            .ToListAsync();
    }

    public async Task<List<Entities.Project>> GetAllStandalonePolls()
    {
        return await _dbContext.Projects
            .Include(p => p.Polls)
            .ThenInclude(t => t.Options)
            .Include(p => p.Polls)
            .ThenInclude(t => t.Options)
            .ThenInclude(o => o.Votes)
            .ThenInclude(v => v.Person)
            .Include(p => p.Polls)
            .ThenInclude(t => t.Comments)
            .Include(p => p.Creator)
            .Include(p => p.Permissions)
            .ThenInclude(p => p.Person)
            .Include(p => p.Favorites)
            .Where(p => p.IsStandalone && (p.Creator.Id == UserId ||
                                           p.Permissions.Any(permission => permission.Person.Id == UserId)))
            .Where(p => p.Polls.Any())
            .ToListAsync();
    }

    public async Task<Result<Entities.Project>> Create(string name, string? description)
    {
        var userRequest = await _userService.GetUser();
        if (!userRequest.IsSuccess)
        {
            return Result<Entities.Project>.Fail(userRequest.Code);
        }

        var project = new Entities.Project
        {
            Id = SlugHelper.GenerateId(),
            Name = name.StripHtml(),
            Description = description?.StripHtml(),
            Creator = userRequest.Payload!,
            VisibilityType = VisibilityType.VisibleForSelectedOnly
        };

        _dbContext.Projects.Add(project);
        await _dbContext.SaveChangesAsync();
        return Result<Entities.Project>.Success(project);
    }

    public async Task<Result<Entities.Project>> CreateStandalonePoll(string name, string description,
        OptionType optionType, DateTime? closeDate = null)
    {
        var userRequest = await _userService.GetUser();
        if (!userRequest.IsSuccess)
        {
            return Result<Entities.Project>.Fail(userRequest.Code);
        }

        var project = new Entities.Project
        {
            Id = SlugHelper.GenerateId(),
            Name = name.StripHtml(),
            Description = null,
            IsStandalone = true,
            Creator = userRequest.Payload!,
            VisibilityType = VisibilityType.VisibleForSelectedOnly
        };

        var poll = new Poll
        {
            Id = SlugHelper.GenerateId(),
            Name = name.StripHtml(),
            Description = description.StripHtml(),
            OptionType = optionType,
            Project = project,
            CloseDate = closeDate.HasValue ? DateTime.SpecifyKind(closeDate.Value, DateTimeKind.Utc) : null
        };

        project.Polls.Add(poll);
        _dbContext.Projects.Add(project);
        await _dbContext.SaveChangesAsync();
        return Result<Entities.Project>.Success(project);
    }

    public async Task<Result<Entities.Project>> Update(string slug, string projectName, string? projectDescription)
    {
        var projectToUpdate = await _dbContext.Projects
            .Include(p => p.Permissions)
            .ThenInclude(p => p.Person)
            .Include(p => p.Creator)
            .Where(p => p.Id == SlugHelper.ExtractId(slug) &&
                        (p.Creator.Id == UserId || p.Permissions.Any(permission =>
                            permission.Person.Id == UserId && permission.PermissionType == PermissionType.Owner)))
            .SingleOrDefaultAsync();

        if (projectToUpdate is null)
        {
            return Result<Entities.Project>.Fail(404);
        }

        projectToUpdate.Name = projectName.StripHtml();
        projectToUpdate.Description = projectDescription?.StripHtml();
        await _dbContext.SaveChangesAsync();
        return Result<Entities.Project>.Success(projectToUpdate);
    }

    public async Task<Result> Delete(string slug)
    {
        var deletedProjects = await _dbContext.Projects
            .Where(p => p.Id == SlugHelper.ExtractId(slug) && (p.Creator.Id == UserId || p.Permissions.Any(permission =>
                permission.Person.Id == UserId && permission.PermissionType == PermissionType.Owner)))
            .ExecuteDeleteAsync();

        if (deletedProjects == 0)
        {
            return Result.Fail(404);
        }

        await _dbContext.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result<Entities.Project>> GetPublicInfo(string slug)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Creator)
            .Include(p => p.Permissions)
            .ThenInclude(p => p.Person)
            .Include(p => p.Polls)
            .ThenInclude(poll => poll.Options)
            .ThenInclude(option => option.Votes)
            .ThenInclude(vote => vote.Person)
            .Where(p => p.Id == SlugHelper.ExtractId(slug))
            .SingleOrDefaultAsync();

        if (project == null)
        {
            return Result<Entities.Project>.Fail(404);
        }

        if (project.VisibilityType != VisibilityType.VisibleForEverbody &&
            project.Creator.Id != UserId &&
            project.Permissions.All(p => p.PersonKey != UserId))
        {
            return Result<Entities.Project>.Fail(403);
        }

        return Result<Entities.Project>.Success(project);
    }

    public async Task<Result<Entities.Project>> Get(string slug)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Creator)
            .Include(p => p.Permissions)
            .ThenInclude(p => p.Person)
            .Include(p => p.Polls)
            .ThenInclude(t => t.Options)
            .ThenInclude(o => o.Meta)
            .Include(p => p.Polls)
            .ThenInclude(t => t.Options)
            .ThenInclude(o => o.Votes)
            .Include(p => p.Polls)
            .ThenInclude(t => t.Comments)
            .Where(p => p.Id == SlugHelper.ExtractId(slug) &&
                        (p.VisibilityType == VisibilityType.VisibleForEverbody || p.Creator.Id == UserId ||
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
            await _permissionService.AddOrUpdatePermissionForUser(user.Payload!, false, project, PermissionType.Voter,
                true);
        }

        return Result<Entities.Project>.Success(project);
    }

    public async Task<Result<bool>> ToggleFavoriteAsync(string projectSlug, Guid userId)
    {
        var projectId = SlugHelper.ExtractId(projectSlug);
        var isMember = await _dbContext.Projects
            .AnyAsync(p => p.Id == projectId &&
                           (p.Creator.Id == userId || p.Permissions.Any(perm => perm.PersonKey == userId)));

        if (!isMember)
        {
            return Result<bool>.Fail(403);
        }

        var existing = await _dbContext.ProjectFavorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.ProjectId == projectId);

        if (existing is not null)
        {
            _dbContext.ProjectFavorites.Remove(existing);
            await _dbContext.SaveChangesAsync();
            return Result<bool>.Success(false);
        }

        var user = (await _userService.GetUser()).Payload!;
        var project = await _dbContext.Projects.FindAsync(projectId);

        _dbContext.ProjectFavorites.Add(new ProjectFavorite
        {
            UserId = userId,
            User = user,
            Project = project!,
            ProjectId = projectId!
        });
        await _dbContext.SaveChangesAsync();
        return Result<bool>.Success(true);
    }
}
