using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class AddMailOutboxAndPendingPollUpdates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OutboxMails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Payload = table.Column<string>(type: "text", nullable: false),
                    Attempts = table.Column<int>(type: "integer", nullable: false),
                    NextAttemptAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastError = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Edited = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboxMails", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PendingPollUpdates",
                columns: table => new
                {
                    PollId = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    Changes = table.Column<string>(type: "text", nullable: false),
                    DueAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Edited = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PendingPollUpdates", x => x.PollId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMails_NextAttemptAt",
                table: "OutboxMails",
                column: "NextAttemptAt");

            migrationBuilder.CreateIndex(
                name: "IX_PendingPollUpdates_DueAt",
                table: "PendingPollUpdates",
                column: "DueAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OutboxMails");

            migrationBuilder.DropTable(
                name: "PendingPollUpdates");
        }
    }
}
