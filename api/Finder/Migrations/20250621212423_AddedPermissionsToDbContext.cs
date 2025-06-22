using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class AddedPermissionsToDbContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Permission");

            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    PersonKey = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectKey = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissions", x => new { x.PersonKey, x.ProjectKey });
                    table.ForeignKey(
                        name: "FK_Permissions_Persons_PersonKey",
                        column: x => x.PersonKey,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Permissions_Projects_ProjectKey",
                        column: x => x.ProjectKey,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_PersonKey_ProjectKey",
                table: "Permissions",
                columns: new[] { "PersonKey", "ProjectKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_ProjectKey",
                table: "Permissions",
                column: "ProjectKey");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.CreateTable(
                name: "Permission",
                columns: table => new
                {
                    PersonKey = table.Column<Guid>(type: "uuid", nullable: false),
                    ProjectKey = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permission", x => new { x.PersonKey, x.ProjectKey });
                    table.ForeignKey(
                        name: "FK_Permission_Persons_PersonKey",
                        column: x => x.PersonKey,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Permission_Projects_ProjectKey",
                        column: x => x.ProjectKey,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Permission_PersonKey_ProjectKey",
                table: "Permission",
                columns: new[] { "PersonKey", "ProjectKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Permission_ProjectKey",
                table: "Permission",
                column: "ProjectKey");
        }
    }
}
