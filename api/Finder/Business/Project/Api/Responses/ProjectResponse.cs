namespace Finder.Business.Project.Api.Responses;

public class ProjectResponseOption
{
    public required string Id { get; set; }
    public required string Text { get; set; }
    public required string OptionType { get; set; }
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
}

public static class ProjectMapper
{
    private static ProjectResponseOption ToProjectResponseOption(this Entities.Option option)
    {
        return new ProjectResponseOption
        {
            Id = option.Id.ToString(),
            Text = option.Text,
            OptionType = Enum.GetName(option.OptionType)!
        };
    }
    
    private static ProjectResponseTopic ToProjectResponseTopic(this Entities.Topic topic)
    {
        return new ProjectResponseTopic
        {
            Id = topic.Id.ToString(),
            Name = topic.Name,
            Options = topic.Options.Select(ToProjectResponseOption).ToArray()
        };
    }
    
    public static ProjectResponse ToProjectResponse(this Entities.Project project)
    {
        return new ProjectResponse
        {
            Id = project.Id.ToString(),
            Name = project.Name,
            Topics = project.Topics.Select(ToProjectResponseTopic).ToArray()
        };
    }
    
    
}