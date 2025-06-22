namespace Finder.Business.Project.Api.Responses;

public class ProjectResponseOption
{
    public required string Id { get; set; }
    public required string Text { get; set; }
    public required int OptionType { get; set; }
    public required int Votes { get; set; }
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
    public required ProjectResponseOption[] Options { get; set; }
}

public class ProjectResponse
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required ProjectResponseTopic[] Topics { get; set; }
    public required int PermissionType { get; set; }
    public required string Creator { get; set; }
    public required ProjectRole Role { get; set; }
    public required ProjectSharedWith[] SharedWith { get; set; }
}

public static class ProjectMapper
{
    public static ProjectResponseOption ToProjectResponseOption(this Entities.Option option)
    {
        return new ProjectResponseOption
        {
            Id = option.Id.ToString(),
            Text = option.Text,
            OptionType = (int)option.OptionType,
            Votes = option.Choices.Sum(c => c.Votes.Count)
        };
    }

    public static ProjectResponseTopic ToProjectResponseTopic(this Entities.Topic topic)
    {
        return new ProjectResponseTopic
        {
            Id = topic.Id.ToString(),
            Name = topic.Name,
            Options = topic.Options.Select(ToProjectResponseOption).ToArray()
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
            Topics = project.Topics.Select(ToProjectResponseTopic).ToArray(),
            PermissionType = (int)project.VisibilityType,
            Creator = project.Creator.Name ??  project.Creator.Email,
            Role = project.GetRole(userId),
            SharedWith = sharedWith.ToArray()
        };
    }
}