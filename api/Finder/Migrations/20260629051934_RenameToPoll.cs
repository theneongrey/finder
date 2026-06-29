using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class RenameToPoll : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Topics_TopicId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Options_Topics_TopicId",
                table: "Options");

            migrationBuilder.RenameTable(
                name: "Topics",
                newName: "Polls");

            migrationBuilder.RenameIndex(
                name: "IX_Topics_ProjectId",
                table: "Polls",
                newName: "IX_Polls_ProjectId");

            migrationBuilder.RenameColumn(
                name: "TopicId",
                table: "Options",
                newName: "PollId");

            migrationBuilder.RenameIndex(
                name: "IX_Options_TopicId",
                table: "Options",
                newName: "IX_Options_PollId");

            migrationBuilder.RenameColumn(
                name: "TopicId",
                table: "Comments",
                newName: "PollId");

            migrationBuilder.RenameIndex(
                name: "IX_Comments_TopicId",
                table: "Comments",
                newName: "IX_Comments_PollId");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Polls_PollId",
                table: "Comments",
                column: "PollId",
                principalTable: "Polls",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Options_Polls_PollId",
                table: "Options",
                column: "PollId",
                principalTable: "Polls",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Polls_PollId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Options_Polls_PollId",
                table: "Options");

            migrationBuilder.RenameTable(
                name: "Polls",
                newName: "Topics");

            migrationBuilder.RenameIndex(
                name: "IX_Polls_ProjectId",
                table: "Topics",
                newName: "IX_Topics_ProjectId");

            migrationBuilder.RenameColumn(
                name: "PollId",
                table: "Options",
                newName: "TopicId");

            migrationBuilder.RenameIndex(
                name: "IX_Options_PollId",
                table: "Options",
                newName: "IX_Options_TopicId");

            migrationBuilder.RenameColumn(
                name: "PollId",
                table: "Comments",
                newName: "TopicId");

            migrationBuilder.RenameIndex(
                name: "IX_Comments_PollId",
                table: "Comments",
                newName: "IX_Comments_TopicId");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Topics_TopicId",
                table: "Comments",
                column: "TopicId",
                principalTable: "Topics",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Options_Topics_TopicId",
                table: "Options",
                column: "TopicId",
                principalTable: "Topics",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
