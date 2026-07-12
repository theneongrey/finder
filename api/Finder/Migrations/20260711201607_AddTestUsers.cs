using Finder.Business.Auth.Entities;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class AddTestUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Persons",
                columns: ["Id", "Email", "Name", "HasLoggedIn", "Role", "Created", "Edited"],
                values: new object[,]
                {
                    { Guid.NewGuid(), "testuser1@neongrey.de", "Test User 1", false, (int)Role.TestUser, DateTime.UtcNow, DateTime.UtcNow },
                    { Guid.NewGuid(), "testuser2@neongrey.de", "Test User 2", false, (int)Role.TestUser, DateTime.UtcNow, DateTime.UtcNow },
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(table: "Persons", keyColumn: "Email", keyValue: "testuser1@neongrey.de");
            migrationBuilder.DeleteData(table: "Persons", keyColumn: "Email", keyValue: "testuser2@neongrey.de");
        }
    }
}
