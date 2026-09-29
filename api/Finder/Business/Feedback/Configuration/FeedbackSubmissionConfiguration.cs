using Finder.Business.Feedback.Entities;
using Finder.Business.Feedback.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Finder.Business.Feedback.Configuration;

public class FeedbackSubmissionConfiguration : IEntityTypeConfiguration<FeedbackSubmission>
{
    public void Configure(EntityTypeBuilder<FeedbackSubmission> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Type)
            .HasConversion<int>();

        builder.Property(s => s.Comment)
            .HasMaxLength(FeedbackService.MaxCommentLength);

        builder.Property(s => s.Page)
            .HasMaxLength(FeedbackService.MaxPageLength);

        builder.HasIndex(s => new { s.PersonId, s.SubmittedAt });
        builder.HasIndex(s => s.SentAt);

        builder.HasOne(s => s.Person)
            .WithMany()
            .HasForeignKey(s => s.PersonId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
