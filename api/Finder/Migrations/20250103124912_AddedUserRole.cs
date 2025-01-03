using Finder.Business.Auth.Entities;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class AddedUserRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Role",
                table: "Persons",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Persons",
                keyColumn: "Email",
                keyValue: "test@neongrey.de",
                column: "Role",
                value: (int)Role.Admin
            );
            
            migrationBuilder.UpdateData(
                table: "Persons",
                keyColumn: "Email",
                keyValue: "leistenschneiderei@gmail.com",
                column: "Role",
                value: (int)Role.Admin
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Role",
                table: "Persons");
        }
    }
}
