using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class CascadeDeleteOptionComments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Options_OptionId",
                table: "Comments");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Options_OptionId",
                table: "Comments",
                column: "OptionId",
                principalTable: "Options",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Options_OptionId",
                table: "Comments");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Options_OptionId",
                table: "Comments",
                column: "OptionId",
                principalTable: "Options",
                principalColumn: "Id");
        }
    }
}
