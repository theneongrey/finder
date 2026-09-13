using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentOptionReference : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OptionId",
                table: "Comments",
                type: "character varying(8)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Comments_OptionId",
                table: "Comments",
                column: "OptionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Options_OptionId",
                table: "Comments",
                column: "OptionId",
                principalTable: "Options",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Options_OptionId",
                table: "Comments");

            migrationBuilder.DropIndex(
                name: "IX_Comments_OptionId",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "OptionId",
                table: "Comments");
        }
    }
}
