using Finder.Business.Project.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Project.Configuration;

public class PollConfiguration : IEntityTypeConfiguration<Poll>
{
    public void Configure(EntityTypeBuilder<Poll> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .HasMaxLength(1024);

        builder.Property(p => p.Description)
            .HasMaxLength(200);

        builder.HasMany(p => p.Options)
            .WithOne(p => p.Poll);

        builder.HasMany(p => p.Comments)
            .WithOne(p => p.Poll);

        builder.Property(p => p.OptionType)
            .HasConversion<int>();
    }
}
