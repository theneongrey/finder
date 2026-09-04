using Finder.Business.User.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.User.Configuration;

public class NotificationSettingConfiguration : IEntityTypeConfiguration<NotificationSetting>
{
    public void Configure(EntityTypeBuilder<NotificationSetting> builder)
    {
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Key).HasMaxLength(64).IsRequired();
        builder.Property(n => n.TitleKey).HasMaxLength(128).IsRequired();
        builder.Property(n => n.DescriptionKey).HasMaxLength(128).IsRequired();
        builder.Property(n => n.DefaultValue).HasConversion<int>();

        builder.HasData(
            new NotificationSetting { Id = 1, Key = "pollClosed", TitleKey = "settings.notifications.pollClosed", DescriptionKey = "settings.notifications.pollClosedSub", DefaultValue = NotificationValue.All, SortIndex = 0 },
            new NotificationSetting { Id = 2, Key = "pollReopened", TitleKey = "settings.notifications.pollReopened", DescriptionKey = "settings.notifications.pollReopenedSub", DefaultValue = NotificationValue.All, SortIndex = 1 },
            new NotificationSetting { Id = 3, Key = "newComment", TitleKey = "settings.notifications.newComment", DescriptionKey = "settings.notifications.newCommentSub", DefaultValue = NotificationValue.All, SortIndex = 2 },
            new NotificationSetting { Id = 4, Key = "accessChanged", TitleKey = "settings.notifications.accessChanged", DescriptionKey = "settings.notifications.accessChangedSub", DefaultValue = NotificationValue.All, SortIndex = 3 },
            new NotificationSetting { Id = 5, Key = "pollShared", TitleKey = "settings.notifications.pollShared", DescriptionKey = "settings.notifications.pollSharedSub", DefaultValue = NotificationValue.All, SortIndex = 4 },
            new NotificationSetting { Id = 6, Key = "pollUpdated", TitleKey = "settings.notifications.pollUpdated", DescriptionKey = "settings.notifications.pollUpdatedSub", DefaultValue = NotificationValue.All, SortIndex = 5 }
        );
    }
}
