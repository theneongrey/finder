using Finder.Business.Auth.Entities;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class Added2ndTestUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Persons",
                columns: [ "Id", "Email", "Name", "HasLoggedIn", "Role", "Created", "Edited" ],
                values: new object[,]
                {
                    { Guid.NewGuid(), "finder@neongrey.de", "Finder Test User", false, (int)Role.Upgraded, DateTime.UtcNow, DateTime.UtcNow },
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
