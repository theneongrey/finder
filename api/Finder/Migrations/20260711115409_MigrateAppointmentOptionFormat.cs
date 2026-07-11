using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class MigrateAppointmentOptionFormat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Single-date entries (no semicolon) → date;{ts}
            migrationBuilder.Sql("""
                UPDATE "Options"
                SET "Text" = 'date;' || "Text"
                WHERE "PollId" IN (SELECT "Id" FROM "Polls" WHERE "OptionType" = 2)
                  AND "Text" NOT LIKE '%;%';
                """);

            // Date-range entries (one semicolon) → date-range;{ts};{ts}
            migrationBuilder.Sql("""
                UPDATE "Options"
                SET "Text" = 'date-range;' || "Text"
                WHERE "PollId" IN (SELECT "Id" FROM "Polls" WHERE "OptionType" = 2)
                  AND "Text" LIKE '%;%';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "Options"
                SET "Text" = SUBSTRING("Text" FROM 6)
                WHERE "PollId" IN (SELECT "Id" FROM "Polls" WHERE "OptionType" = 2)
                  AND "Text" LIKE 'date;%';
                """);

            migrationBuilder.Sql("""
                UPDATE "Options"
                SET "Text" = SUBSTRING("Text" FROM 12)
                WHERE "PollId" IN (SELECT "Id" FROM "Polls" WHERE "OptionType" = 2)
                  AND "Text" LIKE 'date-range;%';
                """);
        }
    }
}
