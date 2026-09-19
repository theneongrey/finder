using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class ExpandOptionTypeAndStripDatePrefix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Re-type existing date polls (OptionType = 2) from their options'
            // sub-type prefix. Single-date (date;/prefix-less) polls stay 2.
            migrationBuilder.Sql("""
                UPDATE "Polls" SET "OptionType" = 4
                WHERE "OptionType" = 2
                  AND "Id" IN (SELECT "PollId" FROM "Options" WHERE "Text" LIKE 'date-range;%');
                """);
            migrationBuilder.Sql("""
                UPDATE "Polls" SET "OptionType" = 3
                WHERE "OptionType" = 2
                  AND "Id" IN (SELECT "PollId" FROM "Options" WHERE "Text" LIKE 'weekday;%');
                """);
            migrationBuilder.Sql("""
                UPDATE "Polls" SET "OptionType" = 6
                WHERE "OptionType" = 2
                  AND "Id" IN (SELECT "PollId" FROM "Options" WHERE "Text" LIKE 'time-range;%');
                """);
            migrationBuilder.Sql("""
                UPDATE "Polls" SET "OptionType" = 5
                WHERE "OptionType" = 2
                  AND "Id" IN (SELECT "PollId" FROM "Options" WHERE "Text" LIKE 'time;%');
                """);

            // Strip the now-redundant sub-type prefix from option text. The
            // poll's OptionType is authoritative from here on. Exact 'xxx;%'
            // patterns are mutually exclusive, so order is irrelevant.
            migrationBuilder.Sql("""UPDATE "Options" SET "Text" = SUBSTRING("Text" FROM 12) WHERE "Text" LIKE 'date-range;%';""");
            migrationBuilder.Sql("""UPDATE "Options" SET "Text" = SUBSTRING("Text" FROM 12) WHERE "Text" LIKE 'time-range;%';""");
            migrationBuilder.Sql("""UPDATE "Options" SET "Text" = SUBSTRING("Text" FROM 9)  WHERE "Text" LIKE 'weekday;%';""");
            migrationBuilder.Sql("""UPDATE "Options" SET "Text" = SUBSTRING("Text" FROM 6)  WHERE "Text" LIKE 'date;%';""");
            migrationBuilder.Sql("""UPDATE "Options" SET "Text" = SUBSTRING("Text" FROM 6)  WHERE "Text" LIKE 'time;%';""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Re-add the sub-type prefix based on the poll's OptionType.
            migrationBuilder.Sql("""
                UPDATE "Options" SET "Text" = 'date-range;' || "Text"
                WHERE "PollId" IN (SELECT "Id" FROM "Polls" WHERE "OptionType" = 4);
                """);
            migrationBuilder.Sql("""
                UPDATE "Options" SET "Text" = 'weekday;' || "Text"
                WHERE "PollId" IN (SELECT "Id" FROM "Polls" WHERE "OptionType" = 3);
                """);
            migrationBuilder.Sql("""
                UPDATE "Options" SET "Text" = 'time-range;' || "Text"
                WHERE "PollId" IN (SELECT "Id" FROM "Polls" WHERE "OptionType" = 6);
                """);
            migrationBuilder.Sql("""
                UPDATE "Options" SET "Text" = 'time;' || "Text"
                WHERE "PollId" IN (SELECT "Id" FROM "Polls" WHERE "OptionType" = 5);
                """);
            migrationBuilder.Sql("""
                UPDATE "Options" SET "Text" = 'date;' || "Text"
                WHERE "PollId" IN (SELECT "Id" FROM "Polls" WHERE "OptionType" = 2);
                """);

            // Collapse the granular date types back to the umbrella Date (2).
            migrationBuilder.Sql("""UPDATE "Polls" SET "OptionType" = 2 WHERE "OptionType" IN (3, 4, 5, 6);""");
        }
    }
}
