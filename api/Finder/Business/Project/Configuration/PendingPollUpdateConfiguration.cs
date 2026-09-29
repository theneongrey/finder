using Finder.Business.Project.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Project.Configuration;

public class PendingPollUpdateConfiguration : IEntityTypeConfiguration<PendingPollUpdate>
{
    public void Configure(EntityTypeBuilder<PendingPollUpdate> builder)
    {
        builder.HasKey(p => p.PollId);

        builder.Property(p => p.PollId)
            .HasMaxLength(8);

        builder.HasIndex(p => p.DueAt);
    }
}
