using Finder.Business.Permission.Entities;
using Finder.Business.Project.Entities;
using Finder.Business.Shared;
using Microsoft.EntityFrameworkCore;

namespace Finder.Business.Project.Services;

/// <summary>
/// Shared poll/option query building blocks: the include graph the poll detail response needs,
/// and the read/maintain access predicates, so every query applies them identically.
/// </summary>
public static class PollQueryExtensions
{
    /// <summary>
    /// Options (creator, meta, votes + voters) and comments (author, option). Split into one query
    /// per collection — options and comments are sibling collections, so a single JOIN would return
    /// options × votes × comments rows.
    /// </summary>
    public static IQueryable<Poll> IncludeDetails(this IQueryable<Poll> query)
    {
        return query
            .AsSplitQuery()
            .Include(t => t.Options)
            .ThenInclude(o => o.Creator)
            .Include(t => t.Options)
            .ThenInclude(o => o.Meta)
            .Include(t => t.Options)
            .ThenInclude(o => o.Votes)
            .ThenInclude(v => v.Person)
            .Include(t => t.Comments)
            .ThenInclude(c => c.Person)
            .Include(t => t.Comments)
            .ThenInclude(c => c.Option);
    }

    /// <summary>The owning project's creator and permitted people (notification recipients).</summary>
    public static IQueryable<Poll> IncludeProjectMembers(this IQueryable<Poll> query)
    {
        return query
            .Include(t => t.Project).ThenInclude(p => p.Creator)
            .Include(t => t.Project).ThenInclude(p => p.Permissions).ThenInclude(perm => perm.Person);
    }

    /// <summary>The poll with this slug, if the project is public or the user is its creator or has any permission.</summary>
    public static IQueryable<Poll> WhereReadableBy(this IQueryable<Poll> query, string slug, Guid? userId)
    {
        return query.Where(t => t.Id == SlugHelper.ExtractId(slug) && (
            t.Project.VisibilityType == VisibilityType.VisibleForEverbody ||
            t.Project.Creator.Id == userId ||
            t.Project.Permissions.Any(permission => permission.PersonKey == userId)));
    }

    /// <summary>The poll with this slug, if the user is the project creator or at least a Maintainer.</summary>
    public static IQueryable<Poll> WhereMaintainableBy(this IQueryable<Poll> query, string slug, Guid? userId)
    {
        return query.Where(t => t.Id == SlugHelper.ExtractId(slug) && (t.Project.Creator.Id == userId ||
                                                                      t.Project.Permissions.Any(permission =>
                                                                          permission.Person.Id == userId &&
                                                                          permission.PermissionType >=
                                                                          PermissionType.Maintainer)));
    }

    /// <summary>The option with this slug, if its project is public or the user is its creator or has any permission.</summary>
    public static IQueryable<Option> WhereReadableBy(this IQueryable<Option> query, string slug, Guid? userId)
    {
        return query.Where(o => o.Id == SlugHelper.ExtractId(slug) && (
            o.Poll.Project.VisibilityType == VisibilityType.VisibleForEverbody ||
            o.Poll.Project.Creator.Id == userId ||
            o.Poll.Project.Permissions.Any(permission => permission.PersonKey == userId)));
    }
}
