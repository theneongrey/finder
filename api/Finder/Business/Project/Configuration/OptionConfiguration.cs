using Finder.Business.Project.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Project.Configuration;

public class OptionConfiguration : IEntityTypeConfiguration<Option>
{
    public void Configure(EntityTypeBuilder<Option> builder)
    {
        builder.HasKey(p => p.Id);
        
        builder.Property(p => p.Text)
            .HasMaxLength(1024);
        
        builder.HasMany(p => p.Votes)
            .WithOne(p => p.Option);
    }
}