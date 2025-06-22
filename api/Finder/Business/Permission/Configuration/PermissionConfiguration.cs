using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Permission.Configuration;

public class PermissionConfiguration : IEntityTypeConfiguration<Entities.Permission>
{
    public void Configure(EntityTypeBuilder<Entities.Permission> builder)
    {
        builder.HasKey(p => new { p.PersonKey, p.ProjectKey });
        
        builder.HasIndex(p => new { p.PersonKey, p.ProjectKey })
            .IsUnique();
        
        builder.HasOne(p => p.Person)
            .WithMany(p => p.Permissions)
            .HasForeignKey(p => p.PersonKey);
        
        builder.HasOne(p => p.Project)
            .WithMany(p => p.Permissions)
            .HasForeignKey(p => p.ProjectKey);
        
        builder.Property(p => p.PermissionType)
            .HasConversion<int>();
    }
}