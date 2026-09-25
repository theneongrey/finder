namespace Finder.Business.Project.RealTime;

/// <summary>
/// Signals "something on this poll changed" to everyone present on the poll detail page.
/// Purely a ping — no poll data is serialized; clients fetch the actual changes via the
/// delta REST endpoint. Additive to the existing e-mail/notification flow.
/// </summary>
public interface IPollChangeNotifier
{
    /// <summary>
    /// Pings the poll's presence group. <paramref name="actorUserId"/> is the user who caused
    /// the change so the originating client can ignore its own echo.
    /// </summary>
    Task PollChanged(string pollId, Guid? actorUserId);
}
