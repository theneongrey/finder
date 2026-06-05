using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class MoveOptionTypeToTopic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OptionType",
                table: "Options");

            migrationBuilder.AddColumn<int>(
                name: "OptionType",
                table: "Topics",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OptionType",
                table: "Topics");

            migrationBuilder.AddColumn<int>(
                name: "OptionType",
                table: "Options",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
