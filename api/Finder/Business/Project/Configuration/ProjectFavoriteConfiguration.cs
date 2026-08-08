using Finder.Business.Project.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Project.Configuration;

public class ProjectFavoriteConfiguration : IEntityTypeConfiguration<ProjectFavorite>
{
    public void Configure(EntityTypeBuilder<ProjectFavorite> builder)
    {
        builder.HasKey(f => new { f.UserId, f.ProjectId });

        builder.HasOne(f => f.User)
            .WithMany()
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(f => f.Project)
            .WithMany(p => p.Favorites)
            .HasForeignKey(f => f.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
