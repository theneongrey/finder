using Finder.Business.Auth.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Auth.Configuration;

public class PersonConfiguration : IEntityTypeConfiguration<Person>
{
    public void Configure(EntityTypeBuilder<Person> builder)
    {
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Email)
            .HasMaxLength(320);

        builder.Property(n => n.Name)
            .HasMaxLength(250);

        builder.Property(n => n.Picture)
            .HasMaxLength(100);

        builder.Property(c => c.Role)
            .HasConversion<int>();

        builder.Property(n => n.Language)
            .HasMaxLength(10)
            .HasDefaultValue("en");
    }
}