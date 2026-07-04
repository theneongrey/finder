using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class AddOptionMeta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OptionMetas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    SiteName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Edited = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OptionMetas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OptionMetas_Options_Id",
                        column: x => x.Id,
                        principalTable: "Options",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(@"
                INSERT INTO ""OptionMetas"" (""Id"", ""Url"", ""Title"", ""Description"", ""ImageUrl"", ""SiteName"", ""Created"", ""Edited"")
                SELECT ""Id"", ""Url"", '', '', '', '', NOW(), NOW()
                FROM ""Options""
                WHERE ""Url"" IS NOT NULL AND ""Url"" <> ''
            ");

            migrationBuilder.DropColumn(
                name: "PreviewImageUrl",
                table: "Options");

            migrationBuilder.DropColumn(
                name: "Url",
                table: "Options");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PreviewImageUrl",
                table: "Options",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Url",
                table: "Options",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(@"
                UPDATE ""Options"" o
                SET ""Url"" = m.""Url""
                FROM ""OptionMetas"" m
                WHERE o.""Id"" = m.""Id""
            ");

            migrationBuilder.DropTable(
                name: "OptionMetas");
        }
    }
}
