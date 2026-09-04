using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NotificationSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    TitleKey = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    DescriptionKey = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    DefaultValue = table.Column<int>(type: "integer", nullable: false),
                    SortIndex = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PersonNotificationSettings",
                columns: table => new
                {
                    PersonId = table.Column<Guid>(type: "uuid", nullable: false),
                    NotificationSettingId = table.Column<int>(type: "integer", nullable: false),
                    Value = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PersonNotificationSettings", x => new { x.PersonId, x.NotificationSettingId });
                    table.ForeignKey(
                        name: "FK_PersonNotificationSettings_NotificationSettings_Notificatio~",
                        column: x => x.NotificationSettingId,
                        principalTable: "NotificationSettings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PersonNotificationSettings_Persons_PersonId",
                        column: x => x.PersonId,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "NotificationSettings",
                columns: new[] { "Id", "DefaultValue", "DescriptionKey", "Key", "SortIndex", "TitleKey" },
                values: new object[,]
                {
                    { 1, 2, "settings.notifications.pollClosedSub", "pollClosed", 0, "settings.notifications.pollClosed" },
                    { 2, 2, "settings.notifications.pollReopenedSub", "pollReopened", 1, "settings.notifications.pollReopened" },
                    { 3, 2, "settings.notifications.newCommentSub", "newComment", 2, "settings.notifications.newComment" },
                    { 4, 2, "settings.notifications.accessChangedSub", "accessChanged", 3, "settings.notifications.accessChanged" },
                    { 5, 2, "settings.notifications.pollSharedSub", "pollShared", 4, "settings.notifications.pollShared" },
                    { 6, 2, "settings.notifications.pollUpdatedSub", "pollUpdated", 5, "settings.notifications.pollUpdated" }
                });

            migrationBuilder.Sql(@"
                INSERT INTO ""PersonNotificationSettings"" (""PersonId"", ""NotificationSettingId"", ""Value"")
                SELECT p.""Id"", ns.""Id"", ns.""DefaultValue""
                FROM ""Persons"" p
                CROSS JOIN ""NotificationSettings"" ns
                WHERE p.""HasLoggedIn"" = true;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_PersonNotificationSettings_NotificationSettingId",
                table: "PersonNotificationSettings",
                column: "NotificationSettingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PersonNotificationSettings");

            migrationBuilder.DropTable(
                name: "NotificationSettings");
        }
    }
}
