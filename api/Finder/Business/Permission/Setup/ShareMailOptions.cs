namespace Finder.Business.Permission.Setup;

public class MailTemplate
{
    public required string Subject { get; set; }
}

public class ShareMailOptions
{
    public required MailTemplate Update { get; set; }
    public required MailTemplate Shared { get; set; }
    public required MailTemplate SharedAndInvited { get; set; }
    public required MailTemplate Removed { get; set; }
}