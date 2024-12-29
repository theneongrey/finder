using Finder.Business.Auth.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Auth.Configuration;

public class LoginTokenConfiguration : IEntityTypeConfiguration<LoginToken>
{
    public void Configure(EntityTypeBuilder<LoginToken> builder)
    {
        builder.HasKey(p => p.Id);
        
        builder.Property(p => p.Token)
            .HasMaxLength(32);
        
        builder.Property(p => p.RedirectUrl)
            .HasMaxLength(512);

        builder.HasIndex(p => p.Token).IsUnique();

        builder.HasOne(p => p.Person);
    }
}