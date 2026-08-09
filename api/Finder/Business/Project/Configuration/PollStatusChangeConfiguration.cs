using Finder.Business.Project.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Project.Configuration;

public class PollStatusChangeConfiguration : IEntityTypeConfiguration<PollStatusChange>
{
    public void Configure(EntityTypeBuilder<PollStatusChange> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Action)
            .HasConversion<int>();

        builder.HasOne(p => p.ChangedBy);
    }
}
