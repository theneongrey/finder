using Finder.Business.Preview.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Preview.Configuration;

public class DomQueryConfiguration : IEntityTypeConfiguration<DomQuery>
{
    public void Configure(EntityTypeBuilder<DomQuery> builder)
    {
        builder.HasKey(p => p.Id);

        builder.HasIndex(p => p.Query).IsUnique();
    }
}
