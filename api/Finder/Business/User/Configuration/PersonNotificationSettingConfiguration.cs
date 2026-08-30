using Finder.Business.User.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.User.Configuration;

public class PersonNotificationSettingConfiguration : IEntityTypeConfiguration<PersonNotificationSetting>
{
    public void Configure(EntityTypeBuilder<PersonNotificationSetting> builder)
    {
        builder.HasKey(p => new { p.PersonId, p.NotificationSettingId });
        builder.Property(p => p.Value).HasConversion<int>();

        builder.HasOne(p => p.Person)
            .WithMany()
            .HasForeignKey(p => p.PersonId);

        builder.HasOne(p => p.NotificationSetting)
            .WithMany()
            .HasForeignKey(p => p.NotificationSettingId);
    }
}
