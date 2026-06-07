namespace Finder.Business.Project.Api.Responses;

public class ProjectResponseOption
{
    public required string Id { get; set; }
    public required string Text { get; set; }
    public required int Votes { get; set; }
    public required string? Choice { get; set; }
}

public class ProjectSharedWith
{
    public required string Name { get; set; }
    public required ProjectRole Role { get; set; }
}

public class ProjectResponseTopic
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required int OptionType { get; set; }
    public required int OptionCount { get; set; }
    public string? NextOpenOptionId { get; set; }
}

public class ProjectResponse
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required ProjectResponseTopic[] Topics { get; set; }
    public required int PermissionType { get; set; }
    public required string Creator { get; set; }
    public required ProjectRole Role { get; set; }
    public required ProjectSharedWith[] SharedWith { get; set; }
}

public static class ProjectMapper
{
    public static ProjectResponseOption ToProjectResponseOption(this Entities.Option option, Guid? userId)
    {
        return new ProjectResponseOption
        {
            Id = option.Id.ToString(),
            Text = option.Text,
            Votes = option.Votes.Count,
            Choice = option.Votes.FirstOrDefault(v => v.Person.Id == userId)?.Choice,
        };
    }

    public static ProjectResponseTopic ToProjectResponseTopic(this Entities.Topic topic, Guid? userId)
    {
        return new ProjectResponseTopic
        {
            Id = topic.Id.ToString(),
            Name = topic.Name,
            OptionType = (int)topic.OptionType,
            OptionCount = topic.Options.Count,
            NextOpenOptionId = topic.Options
                .FirstOrDefault(o => o.Votes.All(v => v.Person.Id != userId))?.Id.ToString()
        };
    }

    public static ProjectSharedWith ToProjectSharedWith(this Permission.Entities.Permission permission)
    {
        return new ProjectSharedWith
        {
            Name = permission.Person.Name ?? permission.Person.Email,
            Role = permission.PermissionType.ToProjectRole()
        };
    }

    public static ProjectResponse ToProjectResponse(this Entities.Project project, Guid? userId)
    {
        var sharedWith = project.Permissions.Where(p => p.PersonKey != userId)
            .Select(ToProjectSharedWith);

        if (userId != project.Creator.Id)
        {
            sharedWith = sharedWith.Prepend(
                new ProjectSharedWith
                {
                    Name = project.Creator.Name ?? project.Creator.Email,
                    Role = ProjectRole.Creator
                });
        }

        return new ProjectResponse
        {
            Id = project.Id.ToString(),
            Name = project.Name,
            Description = project.Description,
            Topics = project.Topics.Select(t => t.ToProjectResponseTopic(userId)).ToArray(),
            PermissionType = (int)project.VisibilityType,
            Creator = project.Creator.Name ??  project.Creator.Email,
            Role = project.GetRole(userId),
            SharedWith = sharedWith.ToArray()
        };
    }
}