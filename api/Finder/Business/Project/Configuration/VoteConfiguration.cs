using Finder.Business.Project.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Project.Configuration;

public class VoteConfiguration : IEntityTypeConfiguration<Vote>
{
    public void Configure(EntityTypeBuilder<Vote> builder)
    {
        builder.HasKey(p => p.Id);

        builder.HasOne(p => p.Person);

        // One vote per person and option. VoteService upserts; the index makes a concurrent
        // double-submit fail instead of silently double-counting.
        builder.HasIndex("OptionId", "PersonId")
            .IsUnique();

        builder.Property(p => p.Choice)
            .HasMaxLength(64);
    }
}