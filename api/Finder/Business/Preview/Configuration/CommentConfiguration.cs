using Finder.Business.Preview.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Preview.Configuration;

public class HtmlQueryConfiguration : IEntityTypeConfiguration<HtmlQuery>
{
    public void Configure(EntityTypeBuilder<HtmlQuery> builder)
    {
        builder.HasKey(p => p.Id);

        builder.HasIndex(p => p.Query).IsUnique();
    }
}
