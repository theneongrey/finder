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
            .Include(p => p.Polls)
            .Include(p => p.Creator)
            .Include(p => p.Permissions)
            .ThenInclude(p => p.Person)
            .Where(p => !p.IsStandalone && (p.Creator.Id == UserId || p.Permissions.Any(permission => permission.Person.Id == UserId)))
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
            .Where(p => p.IsStandalone && (p.Creator.Id == UserId || p.Permissions.Any(permission => permission.Person.Id == UserId)))
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
            Name = name,
            Description = description,
            Creator = userRequest.Payload!,
            VisibilityType = VisibilityType.VisibleForSelectedOnly
        };

        _dbContext.Projects.Add(project);
        await _dbContext.SaveChangesAsync();
        return Result<Entities.Project>.Success(project);
    }

    public async Task<Result<Entities.Project>> CreateStandalonePoll(string name, string description, OptionType optionType, DateTime? closeDate = null)
    {
        var userRequest = await _userService.GetUser();
        if (!userRequest.IsSuccess)
        {
            return Result<Entities.Project>.Fail(userRequest.Code);
        }

        var project = new Entities.Project
        {
            Id = SlugHelper.GenerateId(),
            Name = name,
            Description = null,
            IsStandalone = true,
            Creator = userRequest.Payload!,
            VisibilityType = VisibilityType.VisibleForSelectedOnly
        };

        var poll = new Poll
        {
            Id = SlugHelper.GenerateId(),
            Name = name,
            Description = description,
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

        projectToUpdate.Name = projectName;
        projectToUpdate.Description = projectDescription;
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
            .Where(p => p.Id == SlugHelper.ExtractId(slug) && (p.VisibilityType == VisibilityType.VisibleForEverbody || p.Creator.Id == UserId ||
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

    public async Task<Result<Poll>> AddPoll(AddPollRequest pollRequest)
    {
        var projectResult = await _dbContext.Projects
            .Include(p => p.Polls)
            .Where(p => p.Id == SlugHelper.ExtractId(pollRequest.ProjectId) && (p.Creator.Id == UserId ||
                                                           p.Permissions.Any(permission =>
                                                               permission.Person.Id == UserId &&
                                                               permission.PermissionType >= PermissionType.Maintainer)))
            .SingleOrDefaultAsync();

        if (projectResult == null)
        {
            return Result<Poll>.Fail(404);
        }

        var poll = new Poll
        {
            Id = SlugHelper.GenerateId(),
            OptionType = pollRequest.OptionType,
            Name = pollRequest.Name,
            Description = pollRequest.Description,
            Project = projectResult,
            CloseDate = pollRequest.CloseDate.HasValue ? DateTime.SpecifyKind(pollRequest.CloseDate.Value, DateTimeKind.Utc) : null
        };

        _dbContext.Polls.Add(poll);

        await _dbContext.SaveChangesAsync();
        return Result<Poll>.Success(poll);
    }

    public async Task<Result<Poll>> UpdatePoll(string slug, string name, string description, DateTime? closeDate = null)
    {
        var poll = await _dbContext.Polls
            .Include(t => t.Project)
            .Include(t => t.Options)
            .ThenInclude(o => o.Votes)
            .ThenInclude(v => v.Person)
            .Where(t => t.Id == SlugHelper.ExtractId(slug) && (t.Project.Creator.Id == UserId ||
                                            t.Project.Permissions.Any(permission =>
                                                permission.Person.Id == UserId &&
                                                permission.PermissionType >= PermissionType.Maintainer)))
            .SingleOrDefaultAsync();

        if (poll is null)
        {
            return Result<Poll>.Fail(404);
        }

        if (poll.CloseDate.HasValue && poll.CloseDate <= DateTime.UtcNow)
        {
            return Result<Poll>.Fail(409);
        }

        poll.Name = name;
        poll.Description = description;
        poll.CloseDate = closeDate.HasValue ? DateTime.SpecifyKind(closeDate.Value, DateTimeKind.Utc) : null;

        if (poll.Project.IsStandalone)
        {
            poll.Project.Name = name;
        }

        await _dbContext.SaveChangesAsync();
        return Result<Poll>.Success(poll);
    }

    public async Task<Result> DeletePoll(string slug)
    {
        var deletedPolls = await _dbContext.Polls
            .Where(t => t.Id == SlugHelper.ExtractId(slug) && (t.Project.Creator.Id == UserId ||
                                            t.Project.Permissions.Any(permission =>
                                                permission.Person.Id == UserId &&
                                                permission.PermissionType >= PermissionType.Maintainer)))
            .ExecuteDeleteAsync();

        if (deletedPolls == 0)
        {
            return Result.Fail(404);
        }

        await _dbContext.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result<Poll>> GetPoll(string slug)
    {
        var poll = await _dbContext.Polls
            .Include(t => t.Options)
            .ThenInclude(o => o.Meta)
            .Include(t => t.Options)
            .ThenInclude(o => o.Votes)
            .ThenInclude(v => v.Person)
            .Include(t => t.Comments)
            .ThenInclude(c => c.Person)
            .Where(t => t.Id == SlugHelper.ExtractId(slug) && (
                t.Project.VisibilityType == VisibilityType.VisibleForEverbody ||
                t.Project.Creator.Id == UserId ||
                t.Project.Permissions.Any(permission => permission.PersonKey == UserId)))
            .SingleOrDefaultAsync();

        if (poll is null)
        {
            return Result<Poll>.Fail(404);
        }

        return Result<Poll>.Success(poll);
    }

    public async Task<Result<Option>> AddOptionToPoll(AddOptionToPollRequest pollRequest)
    {
        var poll = await _dbContext.Polls
            .Where(t => t.Id == SlugHelper.ExtractId(pollRequest.PollId) && (t.Project.Creator.Id == UserId ||
                                                         t.Project.Permissions.Any(permission =>
                                                             permission.Person.Id == UserId &&
                                                             permission.PermissionType >= PermissionType.Maintainer)))
            .FirstOrDefaultAsync();

        if (poll is null)
        {
            return Result<Option>.Fail(404);
        }

        if (poll.CloseDate.HasValue && poll.CloseDate <= DateTime.UtcNow)
        {
            return Result<Option>.Fail(409);
        }

        var option = new Option
        {
            Id = SlugHelper.GenerateId(),
            Text = pollRequest.Text,
            Description = pollRequest.Description,
            Poll = poll
        };

        if (pollRequest.Meta is not null)
        {
            option.Meta = new OptionMeta
            {
                Id = option.Id,
                Url = pollRequest.Meta.Url,
                Title = pollRequest.Meta.Title,
                Description = pollRequest.Meta.Description,
                ImageUrl = pollRequest.Meta.ImageUrl,
                SiteName = pollRequest.Meta.SiteName,
                Option = option
            };
        }
        poll.Options.Add(option);

        _dbContext.Options.Add(option);

        await _dbContext.SaveChangesAsync();
        return Result<Option>.Success(option);
    }

    public async Task<Result<Option>> UpdateOption(string slug, UpdateOptionRequest request)
    {
        var option = await _dbContext.Options
            .Include(o => o.Poll)
            .Include(o => o.Meta)
            .Include(o => o.Votes)
            .ThenInclude(v => v.Person)
            .Where(o => o.Id == SlugHelper.ExtractId(slug) && (o.Poll.Project.Creator.Id == UserId ||
                                             o.Poll.Project.Permissions.Any(permission =>
                                                 permission.Person.Id == UserId &&
                                                 permission.PermissionType >= PermissionType.Maintainer)))
            .FirstOrDefaultAsync();

        if (option is null)
        {
            return Result<Option>.Fail(404);
        }

        if (option.Poll.CloseDate.HasValue && option.Poll.CloseDate <= DateTime.UtcNow)
        {
            return Result<Option>.Fail(409);
        }

        option.Text = request.Text;
        option.Description = request.Description;

        if (request.Meta is not null)
        {
            if (option.Meta is not null)
            {
                option.Meta.Url = request.Meta.Url;
                option.Meta.Title = request.Meta.Title;
                option.Meta.Description = request.Meta.Description;
                option.Meta.ImageUrl = request.Meta.ImageUrl;
                option.Meta.SiteName = request.Meta.SiteName;
            }
            else
            {
                option.Meta = new OptionMeta
                {
                    Id = option.Id,
                    Url = request.Meta.Url,
                    Title = request.Meta.Title,
                    Description = request.Meta.Description,
                    ImageUrl = request.Meta.ImageUrl,
                    SiteName = request.Meta.SiteName,
                    Option = option
                };
            }
        }
        else if (option.Meta is not null)
        {
            _dbContext.OptionMetas.Remove(option.Meta);
            option.Meta = null;
        }

        await _dbContext.SaveChangesAsync();
        return Result<Option>.Success(option);
    }

    public async Task<Result> DeleteOption(string slug)
    {
        var option = await _dbContext.Options
            .Include(o => o.Poll)
            .Where(o => o.Id == SlugHelper.ExtractId(slug) && (o.Poll.Project.Creator.Id == UserId ||
                                             o.Poll.Project.Permissions.Any(permission =>
                                                 permission.Person.Id == UserId &&
                                                 permission.PermissionType >= PermissionType.Maintainer)))
            .FirstOrDefaultAsync();

        if (option is null)
        {
            return Result.Fail(404);
        }

        if (option.Poll.CloseDate.HasValue && option.Poll.CloseDate <= DateTime.UtcNow)
        {
            return Result.Fail(409);
        }

        _dbContext.Options.Remove(option);
        await _dbContext.SaveChangesAsync();
        return Result.Success();
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

    public async Task<Result<Comment>> AddComment(AddCommentRequest request)
    {
        var poll = await _dbContext.Polls
            .Where(t => t.Id == SlugHelper.ExtractId(request.PollId) && (
                t.Project.VisibilityType == VisibilityType.VisibleForEverbody ||
                t.Project.Creator.Id == UserId ||
                t.Project.Permissions.Any(permission => permission.PersonKey == UserId)))
            .FirstOrDefaultAsync();

        if (poll is null)
        {
            return Result<Comment>.Fail(404);
        }

        var user = (await _userService.GetUser()).Payload!;

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Content = request.Content,
            Quote = request.Quote,
            Poll = poll,
            Person = user
        };
        poll.Comments.Add(comment);

        _dbContext.Comments.Add(comment);

        await _dbContext.SaveChangesAsync();
        return Result<Comment>.Success(comment);
    }

    public async Task<Result<Poll>> ClosePollAsync(string slug)
    {
        var poll = await _dbContext.Polls
            .Include(t => t.Options)
            .ThenInclude(o => o.Meta)
            .Include(t => t.Options)
            .ThenInclude(o => o.Votes)
            .ThenInclude(v => v.Person)
            .Include(t => t.Comments)
            .ThenInclude(c => c.Person)
            .Where(t => t.Id == SlugHelper.ExtractId(slug) && (t.Project.Creator.Id == UserId ||
                                            t.Project.Permissions.Any(permission =>
                                                permission.Person.Id == UserId &&
                                                permission.PermissionType >= PermissionType.Maintainer)))
            .SingleOrDefaultAsync();

        if (poll is null)
        {
            return Result<Poll>.Fail(404);
        }

        var actor = await _userService.GetUser();
        poll.CloseDate = DateTime.UtcNow;
        var closedStatus = new PollStatusChange
        {
            Id = Guid.NewGuid(),
            Action = PollStatusAction.Closed,
            Poll = poll,
            ChangedBy = actor.Payload!,
        };
        poll.StatusChanges.Add(closedStatus);
        _dbContext.PollStatusChanges.Add(closedStatus);
        await _dbContext.SaveChangesAsync();
        return Result<Poll>.Success(poll);
    }

    public async Task<Result<Poll>> ReopenPollAsync(string slug)
    {
        var poll = await _dbContext.Polls
            .Include(t => t.Options)
            .ThenInclude(o => o.Meta)
            .Include(t => t.Options)
            .ThenInclude(o => o.Votes)
            .ThenInclude(v => v.Person)
            .Include(t => t.Comments)
            .ThenInclude(c => c.Person)
            .Where(t => t.Id == SlugHelper.ExtractId(slug) && (t.Project.Creator.Id == UserId ||
                                            t.Project.Permissions.Any(permission =>
                                                permission.Person.Id == UserId &&
                                                permission.PermissionType >= PermissionType.Maintainer)))
            .SingleOrDefaultAsync();

        if (poll is null)
        {
            return Result<Poll>.Fail(404);
        }

        var actor = await _userService.GetUser();
        poll.CloseDate = null;
        var reopenedStatus = new PollStatusChange
        {
            Id = Guid.NewGuid(),
            Action = PollStatusAction.Reopened,
            Poll = poll,
            ChangedBy = actor.Payload!,
        };
        poll.StatusChanges.Add(reopenedStatus);
        _dbContext.PollStatusChanges.Add(reopenedStatus);
        await _dbContext.SaveChangesAsync();
        return Result<Poll>.Success(poll);
    }
}
