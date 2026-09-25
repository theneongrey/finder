using Finder.Business.Project.RealTime;
using Xunit;

namespace Finder.Tests.Projects;

public class PollPresenceRegistryTests
{
    private const string PollId = "poll1";

    private static PollParticipant Participant(Guid userId) => new(userId, "Name", null);

    [Fact]
    public void Join_MarksUserActive()
    {
        var registry = new PollPresenceRegistry();
        var user = Guid.NewGuid();

        registry.Join(PollId, "conn-a", Participant(user));

        Assert.True(registry.IsUserActive(PollId, user, TimeSpan.FromSeconds(60)));
    }

    [Fact]
    public void IsUserActive_AfterThresholdWithoutActivity_ReturnsFalse()
    {
        var registry = new PollPresenceRegistry();
        var user = Guid.NewGuid();

        registry.Join(PollId, "conn-a", Participant(user));

        // A zero-length window means the just-stamped activity is already "too old".
        Assert.False(registry.IsUserActive(PollId, user, TimeSpan.Zero));
    }

    [Fact]
    public void RecordActivity_RefreshesTimestamp()
    {
        var registry = new PollPresenceRegistry();
        var user = Guid.NewGuid();

        registry.Join(PollId, "conn-a", Participant(user));
        registry.RecordActivity(PollId, "conn-a");

        Assert.True(registry.IsUserActive(PollId, user, TimeSpan.FromSeconds(60)));
    }

    [Fact]
    public void RecordActivity_ForUnknownConnection_IsNoOp()
    {
        var registry = new PollPresenceRegistry();

        // Must not throw when the connection never joined.
        registry.RecordActivity(PollId, "ghost");

        Assert.Empty(registry.GetRoster(PollId));
    }

    [Fact]
    public void IsUserActive_OtherUserPresent_DoesNotCountForRequestedUser()
    {
        var registry = new PollPresenceRegistry();
        var present = Guid.NewGuid();
        var absent = Guid.NewGuid();

        registry.Join(PollId, "conn-a", Participant(present));

        Assert.False(registry.IsUserActive(PollId, absent, TimeSpan.FromSeconds(60)));
    }

    [Fact]
    public void IsUserActive_MultipleConnections_ActiveIfAnyIsFresh()
    {
        var registry = new PollPresenceRegistry();
        var user = Guid.NewGuid();

        // Two tabs: one stale, one just refreshed. The user counts as active.
        registry.Join(PollId, "conn-stale", Participant(user));
        registry.Join(PollId, "conn-fresh", Participant(user));
        registry.RecordActivity(PollId, "conn-fresh");

        Assert.True(registry.IsUserActive(PollId, user, TimeSpan.FromSeconds(60)));
    }

    [Fact]
    public void IsUserActive_AfterLeave_ReturnsFalse()
    {
        var registry = new PollPresenceRegistry();
        var user = Guid.NewGuid();

        registry.Join(PollId, "conn-a", Participant(user));
        registry.LeavePoll(PollId, "conn-a");

        Assert.False(registry.IsUserActive(PollId, user, TimeSpan.FromSeconds(60)));
    }
}
