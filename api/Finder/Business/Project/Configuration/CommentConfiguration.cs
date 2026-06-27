using Finder.Business.Project.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Project.Configuration;

public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Content)
            .HasMaxLength(2048);

        builder.Property(p => p.Quote)
            .HasMaxLength(1024);

        builder.HasOne(p => p.Person);
    }
}
