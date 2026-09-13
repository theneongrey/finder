using System.Text.Json;
using Finder.Business.User.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.User.Configuration;

public class UserNotificationConfiguration : IEntityTypeConfiguration<UserNotification>
{
    public void Configure(EntityTypeBuilder<UserNotification> builder)
    {
        builder.ToTable("UserNotifications");
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Key).HasConversion<string>().HasMaxLength(64).IsRequired();
        builder.Property(n => n.ProjectId).HasMaxLength(256);
        builder.Property(n => n.PollId).HasMaxLength(256);
        builder.Property(n => n.Variables)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, string>()
            )
            .HasColumnType("jsonb");

        builder.HasOne(n => n.Person)
            .WithMany()
            .HasForeignKey(n => n.PersonId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(n => n.PersonId);
    }
}
