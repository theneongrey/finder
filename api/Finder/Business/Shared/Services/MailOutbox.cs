using System.Text.Json;
using Finder.Business.Shared.Entities;
using Finder.Database;

namespace Finder.Business.Shared.Services;

/// <summary>
/// Queues mails for asynchronous delivery. Callers enqueue instead of talking to SMTP, so a request
/// never waits on (or fails because of) the mail server; <see cref="MailOutboxDispatcher"/> sends them.
/// </summary>
public class MailOutbox(AppDbContext dbContext, MailOutboxDispatcher dispatcher)
{
    public async Task EnqueueAsync(Mail mail)
    {
        dbContext.OutboxMails.Add(new OutboxMail
        {
            Id = Guid.NewGuid(),
            Payload = JsonSerializer.Serialize(mail),
            NextAttemptAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        dispatcher.Signal();
    }
}
