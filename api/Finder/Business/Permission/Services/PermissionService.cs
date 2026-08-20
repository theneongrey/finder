using Finder.Business.Auth.Entities;
using Finder.Business.Permission.Entities;
using Finder.Business.Permission.Setup;
using Finder.Business.Project.Entities;
using Finder.Business.Shared;
using Finder.Business.Shared.Services;
using Finder.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Finder.Business.Permission.Services;

public class PermissionService
{
    private readonly AppDbContext _dbContext;
    private readonly UserService _userService;
    private readonly MailService _mailService;
    private readonly ShareMailOptions _shareMailOptions;

    private Guid? UserId => _userService.GetUserId();

    public PermissionService(AppDbContext dbContext, UserService userService, MailService mailService, IOptions<ShareMailOptions> shareMailOptions)
    {
        _dbContext = dbContext;
        _userService = userService;
        _mailService = mailService;
        _shareMailOptions = shareMailOptions.Value;
    }

    public async Task<Result<List<Person>>> GetInvitedPersons()
    {
        var user = await _userService.GetUser();
        if (!user.IsSuccess || user.Payload!.Role != Role.Admin)
        {
            return Result<List<Person>>.Fail(403);
        }

        var invitedPersons = await _dbContext.Persons
            .Where(p => !p.HasLoggedIn)
            .OrderByDescending(p => p.Created)
            .ToListAsync();

        return Result<List<Person>>.Success(invitedPersons);
    }

    public async Task<List<Api.Responses.SharingContactResponse>> GetGeneralSharingContacts()
    {
        if (!UserId.HasValue)
        {
            return [];
        }

        var contacts = await _dbContext.Permissions
            .Where(p =>
                p.PersonKey != UserId &&
                (p.Project.Creator.Id == UserId ||
                 p.Project.Permissions.Any(pp => pp.PersonKey == UserId)))
            .GroupBy(p => new { p.Person.Id, p.Person.Email, p.Person.Name, p.Person.Picture })
            .Select(g => new Api.Responses.SharingContactResponse
            {
                Name = g.Key.Name ?? g.Key.Email,
                Email = g.Key.Email,
                Picture = g.Key.Picture,
                ShareCount = g.Count()
            })
            .OrderByDescending(c => c.ShareCount)
            .Take(5)
            .ToListAsync();

        return contacts;
    }

    public async Task<List<Api.Responses.SharingContactResponse>> GetSharingContacts(string projectSlug)
    {
        if (!UserId.HasValue)
        {
            return [];
        }

        var currentProject = await _dbContext.Projects
            .Include(p => p.Creator)
            .Include(p => p.Permissions)
            .Where(p => p.Id == SlugHelper.ExtractId(projectSlug))
            .FirstOrDefaultAsync();

        if (currentProject == null)
        {
            return [];
        }

        var excludedIds = currentProject.Permissions.Select(p => p.PersonKey)
            .Append(currentProject.Creator.Id)
            .Append(UserId.Value)
            .ToHashSet();

        var contacts = await _dbContext.Permissions
            .Where(p =>
                !excludedIds.Contains(p.PersonKey) &&
                (p.Project.Creator.Id == UserId ||
                 p.Project.Permissions.Any(pp => pp.PersonKey == UserId)))
            .GroupBy(p => new { p.Person.Id, p.Person.Email, p.Person.Name, p.Person.Picture })
            .Select(g => new Api.Responses.SharingContactResponse
            {
                Name = g.Key.Name ?? g.Key.Email,
                Email = g.Key.Email,
                Picture = g.Key.Picture,
                ShareCount = g.Count()
            })
            .OrderByDescending(c => c.ShareCount)
            .Take(5)
            .ToListAsync();

        return contacts;
    }

    public async Task<Result> UpdateVisibilityType(string projectSlug, VisibilityType visibilityType)
    {
        var project = await _dbContext.Projects
            .Where(p => p.Id == SlugHelper.ExtractId(projectSlug) &&
                        (p.Creator.Id == UserId || p.Permissions.Any(permission =>
                            permission.Person.Id == UserId && permission.PermissionType == PermissionType.Owner)))
            .FirstOrDefaultAsync();

        if (project == null)
        {
            return Result.Fail(404);
        }

        project.VisibilityType = visibilityType;
        await _dbContext.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result<Project.Entities.Project>> RemovePermissionForUser(string email, string projectSlug)
    {
        var cleanEmail = email.Trim().ToLower();

        var project = await _dbContext.Projects
            .Include(p => p.Creator)
            .Include(p => p.Permissions)
            .ThenInclude(p => p.Person)
            .Where(p => p.Id == SlugHelper.ExtractId(projectSlug) &&
                        (p.Creator.Id == UserId ||
                         p.Permissions.Any(pm => pm.PersonKey == UserId && pm.PermissionType == PermissionType.Owner)))
            .FirstOrDefaultAsync();

        if (project == null)
        {
            return Result<Project.Entities.Project>.Fail(404);
        }

        var permission = project.Permissions.Find(p => p.Person.Email == cleanEmail);
        if (permission == null)
        {
            return Result<Project.Entities.Project>.Fail(404);
        }

        if (permission.PersonKey == project.Creator.Id)
        {
            return Result<Project.Entities.Project>.Fail(403);
        }

        project.Permissions.Remove(permission);
        _dbContext.Permissions.Remove(permission);
        await _dbContext.SaveChangesAsync();

        return Result<Project.Entities.Project>.Success(project);
    }

    public async Task<Result<Project.Entities.Project>> AddOrUpdatePermissionForUser(string email, string projectSlug, PermissionType permissionType)
    {
        var cleanEmail = email.Trim().ToLower();

        var isNewUser = false;
        var userRequest = await _userService.GetOrCreatePersonByEmail(cleanEmail, true);
        var user = userRequest.Payload;
        if (!userRequest.IsSuccess || user!.Id == UserId)
        {
            return Result<Project.Entities.Project>.Fail(403);
        }

        if (!user.HasLoggedIn)
        {
            isNewUser = true;
        }

        var project = await _dbContext.Projects
            .Include(p => p.Creator)
            .Include(p => p.Permissions)
            .ThenInclude(p => p.Person)
            .Where(p => p.Id == SlugHelper.ExtractId(projectSlug) &&
                        p.Creator.Id != user.Id && // can't edit rights for creator
                        (p.Creator.Id == UserId || // only creator or owner can update rights
                         p.Permissions.Any(permission => permission.Person.Id == UserId && permission.PermissionType == PermissionType.Owner)))
            .FirstOrDefaultAsync();
        
        if (project == null)
        {
            return Result<Project.Entities.Project>.Fail(404);
        }
        
        return await AddOrUpdatePermissionForUser(user, isNewUser, project, permissionType);
    }

    public async Task<Result<Project.Entities.Project>> AddOrUpdatePermissionForUser(Person user, bool isNewUser, Project.Entities.Project project,
        PermissionType permissionType, bool silent = false)
    {
        var permission = project.Permissions.Find(p => p.Person.Id == user.Id);
        if (permission is not null)
        {
            if (permission.PermissionType != permissionType)
            {
                permission.PermissionType = permissionType;
            }
            else
            {
                return Result<Project.Entities.Project>.Success(project);
            }
        }
        else
        {
            project.Permissions.Add(new Entities.Permission
            {
                Project = project,
                Person = user,
                PermissionType = permissionType
            });
        }

        if (await _dbContext.SaveChangesAsync() == 0)
        {
            return Result<Project.Entities.Project>.Fail(400, "Error while writing to database");
        }
        
        if (!silent)
        {
            var actionUser = await _userService.GetUser();
            if (permission is not null)
            {
                await _mailService.SendMail(user, actionUser.Payload!.Name ?? "Unknown", project.Name,
                    Enum.GetName(permissionType) ?? "Unknown",
                    _shareMailOptions.Update);
            }
            else
            {
                if (isNewUser)
                {
                    await _mailService.SendMail(user, actionUser.Payload!.Name ?? "Unknown", project.Name,
                        Enum.GetName(permissionType) ?? "Unknown",
                        _shareMailOptions.SharedAndInvited);
                }
                else
                {
                    await _mailService.SendMail(user, actionUser.Payload!.Name ?? "Unknown", project.Name,
                        Enum.GetName(permissionType) ?? "Unknown",
                        _shareMailOptions.Shared);
                }
            }
        }

        return Result<Project.Entities.Project>.Success(project);
    }
}