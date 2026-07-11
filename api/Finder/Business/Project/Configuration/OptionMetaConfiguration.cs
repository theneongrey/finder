using Finder.Business.Project.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Project.Configuration;

public class OptionMetaConfiguration : IEntityTypeConfiguration<OptionMeta>
{
    public void Configure(EntityTypeBuilder<OptionMeta> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasMaxLength(8);

        builder.Property(m => m.Url)
            .HasMaxLength(2048);

        builder.Property(m => m.Title)
            .HasMaxLength(500);

        builder.Property(m => m.Description)
            .HasMaxLength(1000);

        builder.Property(m => m.ImageUrl)
            .HasMaxLength(2048);

        builder.Property(m => m.SiteName)
            .HasMaxLength(200);

        builder.HasOne(m => m.Option)
            .WithOne(o => o.Meta)
            .HasForeignKey<OptionMeta>(m => m.Id);
    }
}
