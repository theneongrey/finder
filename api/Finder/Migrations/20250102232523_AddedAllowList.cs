using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class AddedAllowList : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AllowedEmails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AllowedEmails", x => x.Id);
                });
            
            migrationBuilder.InsertData(
                table: "AllowedEmails",
                columns: [ "Id", "Email" ],
                values: new object[,]
                {
                    { Guid.NewGuid(), "test@neongrey.de" },
                    { Guid.NewGuid(), "leistenschneiderei@gmail.com" },
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AllowedEmails");
        }
    }
}
