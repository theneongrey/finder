using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class RemovedChoiceEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Vote_Choice_ChoiceId",
                table: "Vote");

            migrationBuilder.DropTable(
                name: "Choice");

            migrationBuilder.RenameColumn(
                name: "ChoiceId",
                table: "Vote",
                newName: "OptionId");

            migrationBuilder.RenameIndex(
                name: "IX_Vote_ChoiceId",
                table: "Vote",
                newName: "IX_Vote_OptionId");

            migrationBuilder.AddColumn<string>(
                name: "Choice",
                table: "Vote",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_Vote_Options_OptionId",
                table: "Vote",
                column: "OptionId",
                principalTable: "Options",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Vote_Options_OptionId",
                table: "Vote");

            migrationBuilder.DropColumn(
                name: "Choice",
                table: "Vote");

            migrationBuilder.RenameColumn(
                name: "OptionId",
                table: "Vote",
                newName: "ChoiceId");

            migrationBuilder.RenameIndex(
                name: "IX_Vote_OptionId",
                table: "Vote",
                newName: "IX_Vote_ChoiceId");

            migrationBuilder.CreateTable(
                name: "Choice",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OptionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Edited = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Text = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Choice", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Choice_Options_OptionId",
                        column: x => x.OptionId,
                        principalTable: "Options",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Choice_OptionId",
                table: "Choice",
                column: "OptionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Vote_Choice_ChoiceId",
                table: "Vote",
                column: "ChoiceId",
                principalTable: "Choice",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
