using Finder.Business.Project.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Project.Configuration;

public class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.HasKey(p => p.Id);
        
        builder.Property(p => p.Text)
            .HasMaxLength(1024);
        
        builder.HasMany(p => p.Options)
            .WithOne(p => p.Question);
    }
}