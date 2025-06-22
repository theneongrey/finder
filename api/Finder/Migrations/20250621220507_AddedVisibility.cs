using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class AddedVisibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PermissionType",
                table: "Projects",
                newName: "VisibilityType");

            migrationBuilder.AddColumn<int>(
                name: "PermissionType",
                table: "Permissions",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PermissionType",
                table: "Permissions");

            migrationBuilder.RenameColumn(
                name: "VisibilityType",
                table: "Projects",
                newName: "PermissionType");
        }
    }
}
