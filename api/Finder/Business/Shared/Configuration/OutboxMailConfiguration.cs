using Finder.Business.Shared.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Shared.Configuration;

public class OutboxMailConfiguration : IEntityTypeConfiguration<OutboxMail>
{
    public void Configure(EntityTypeBuilder<OutboxMail> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.LastError)
            .HasMaxLength(1000);

        builder.HasIndex(m => m.NextAttemptAt);
    }
}
