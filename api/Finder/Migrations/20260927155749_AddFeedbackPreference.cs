using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class AddFeedbackPreference : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FeedbackPreferences",
                columns: table => new
                {
                    PersonId = table.Column<Guid>(type: "uuid", nullable: false),
                    ButtonHidden = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Edited = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedbackPreferences", x => x.PersonId);
                    table.ForeignKey(
                        name: "FK_FeedbackPreferences_Persons_PersonId",
                        column: x => x.PersonId,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FeedbackPreferences");
        }
    }
}
