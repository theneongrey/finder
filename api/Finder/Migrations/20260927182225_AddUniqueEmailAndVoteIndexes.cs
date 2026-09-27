using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueEmailAndVoteIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Remove duplicate votes a double-submit may have created before the index existed:
            // keep the most recently edited vote per (option, person).
            migrationBuilder.Sql("""
                DELETE FROM "Votes" v
                USING "Votes" newer
                WHERE v."OptionId" = newer."OptionId"
                  AND v."PersonId" = newer."PersonId"
                  AND (v."Edited" < newer."Edited" OR (v."Edited" = newer."Edited" AND v."Id" < newer."Id"));
                """);

            migrationBuilder.DropIndex(
                name: "IX_Votes_OptionId",
                table: "Votes");

            migrationBuilder.CreateIndex(
                name: "IX_Votes_OptionId_PersonId",
                table: "Votes",
                columns: new[] { "OptionId", "PersonId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Persons_Email",
                table: "Persons",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Votes_OptionId_PersonId",
                table: "Votes");

            migrationBuilder.DropIndex(
                name: "IX_Persons_Email",
                table: "Persons");

            migrationBuilder.CreateIndex(
                name: "IX_Votes_OptionId",
                table: "Votes",
                column: "OptionId");
        }
    }
}
