using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class AddOptionCreator : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatorId",
                table: "Options",
                type: "uuid",
                nullable: true);

            // Backfill existing options from their project's creator (Option -> Poll -> Project.Creator).
            migrationBuilder.Sql(@"
                UPDATE ""Options"" AS o
                SET ""CreatorId"" = p.""CreatorId""
                FROM ""Polls"" poll
                JOIN ""Projects"" p ON poll.""ProjectId"" = p.""Id""
                WHERE o.""PollId"" = poll.""Id"";");

            migrationBuilder.AlterColumn<Guid>(
                name: "CreatorId",
                table: "Options",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Options_CreatorId",
                table: "Options",
                column: "CreatorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Options_Persons_CreatorId",
                table: "Options",
                column: "CreatorId",
                principalTable: "Persons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Options_Persons_CreatorId",
                table: "Options");

            migrationBuilder.DropIndex(
                name: "IX_Options_CreatorId",
                table: "Options");

            migrationBuilder.DropColumn(
                name: "CreatorId",
                table: "Options");
        }
    }
}
