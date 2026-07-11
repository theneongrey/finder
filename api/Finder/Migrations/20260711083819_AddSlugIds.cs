using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class AddSlugIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Projects",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Polls",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "Options",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(@"
                UPDATE ""Projects""
                SET ""Slug"" = COALESCE(NULLIF(TRIM(REGEXP_REPLACE(REGEXP_REPLACE(LOWER(""Name""), '[^a-z0-9\s]', '', 'g'), '\s+', '-', 'g')), ''), 'project')
                    || '-' || LEFT(REPLACE(CAST(""Id"" AS text), '-', ''), 8)
                WHERE ""Slug"" = ''
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Polls""
                SET ""Slug"" = COALESCE(NULLIF(TRIM(REGEXP_REPLACE(REGEXP_REPLACE(LOWER(""Name""), '[^a-z0-9\s]', '', 'g'), '\s+', '-', 'g')), ''), 'poll')
                    || '-' || LEFT(REPLACE(CAST(""Id"" AS text), '-', ''), 8)
                WHERE ""Slug"" = ''
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Options""
                SET ""Slug"" = COALESCE(NULLIF(TRIM(REGEXP_REPLACE(REGEXP_REPLACE(LOWER(""Text""), '[^a-z0-9\s]', '', 'g'), '\s+', '-', 'g')), ''), 'option')
                    || '-' || LEFT(REPLACE(CAST(""Id"" AS text), '-', ''), 8)
                WHERE ""Slug"" = ''
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_Slug",
                table: "Projects",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Polls_Slug",
                table: "Polls",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Options_Slug",
                table: "Options",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Projects_Slug",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_Polls_Slug",
                table: "Polls");

            migrationBuilder.DropIndex(
                name: "IX_Options_Slug",
                table: "Options");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Polls");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "Options");
        }
    }
}
