using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class DropDuplicatePermissionIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Permissions_PersonKey_ProjectKey",
                table: "Permissions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Permissions_PersonKey_ProjectKey",
                table: "Permissions",
                columns: new[] { "PersonKey", "ProjectKey" },
                unique: true);
        }
    }
}
