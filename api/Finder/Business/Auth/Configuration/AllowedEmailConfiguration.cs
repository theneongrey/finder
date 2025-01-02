using Finder.Business.Auth.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Auth.Configuration;

public class AllowedEmailConfiguration : IEntityTypeConfiguration<AllowedEmail>
{
    public void Configure(EntityTypeBuilder<AllowedEmail> builder)
    {
        builder.HasKey(p => p.Id);
        
        builder.Property(n => n.Email)
            .HasMaxLength(320);
    }
}