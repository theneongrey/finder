using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Project.Configuration;

public class ProjectConfiguration : IEntityTypeConfiguration<Entities.Project>
{
    public void Configure(EntityTypeBuilder<Entities.Project> builder)
    {
        builder.HasKey(p => p.Id);
        
        builder.Property(p => p.Name)
            .HasMaxLength(128);

        builder.Property(p => p.Description)
            .HasMaxLength(200);

        builder.HasMany(p => p.Topics)
            .WithOne(p => p.Project);
        
        builder.HasOne(p => p.Creator);
        
        builder.Property(p => p.VisibilityType)
            .HasConversion<int>();
    }
}