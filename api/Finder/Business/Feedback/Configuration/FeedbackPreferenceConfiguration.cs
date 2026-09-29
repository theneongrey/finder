using Finder.Business.Feedback.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Feedback.Configuration;

public class FeedbackPreferenceConfiguration : IEntityTypeConfiguration<FeedbackPreference>
{
    public void Configure(EntityTypeBuilder<FeedbackPreference> builder)
    {
        builder.HasKey(p => p.PersonId);
        builder.Property(p => p.ButtonHidden).HasDefaultValue(false);

        builder.HasOne(p => p.Person)
            .WithOne()
            .HasForeignKey<FeedbackPreference>(p => p.PersonId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
