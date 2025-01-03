using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class SetProjectCreatorAsRequired : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Project_Persons_CreatorId",
                table: "Project");

            migrationBuilder.DropForeignKey(
                name: "FK_Topic_Project_ProjectId",
                table: "Topic");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Project",
                table: "Project");

            migrationBuilder.RenameTable(
                name: "Project",
                newName: "Projects");

            migrationBuilder.RenameIndex(
                name: "IX_Project_CreatorId",
                table: "Projects",
                newName: "IX_Projects_CreatorId");

            migrationBuilder.AlterColumn<Guid>(
                name: "CreatorId",
                table: "Projects",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Projects",
                table: "Projects",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_Persons_CreatorId",
                table: "Projects",
                column: "CreatorId",
                principalTable: "Persons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Topic_Projects_ProjectId",
                table: "Topic",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projects_Persons_CreatorId",
                table: "Projects");

            migrationBuilder.DropForeignKey(
                name: "FK_Topic_Projects_ProjectId",
                table: "Topic");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Projects",
                table: "Projects");

            migrationBuilder.RenameTable(
                name: "Projects",
                newName: "Project");

            migrationBuilder.RenameIndex(
                name: "IX_Projects_CreatorId",
                table: "Project",
                newName: "IX_Project_CreatorId");

            migrationBuilder.AlterColumn<Guid>(
                name: "CreatorId",
                table: "Project",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Project",
                table: "Project",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Project_Persons_CreatorId",
                table: "Project",
                column: "CreatorId",
                principalTable: "Persons",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Topic_Project_ProjectId",
                table: "Topic",
                column: "ProjectId",
                principalTable: "Project",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
