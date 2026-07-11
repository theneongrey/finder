using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finder.Migrations
{
    /// <inheritdoc />
    public partial class MigrateToStringIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: add temp string-id columns for principal tables
            // Slug column values are like "my-project-3f4a9c12"; RIGHT(slug,8) gives the 8-char id
            migrationBuilder.Sql(@"
                ALTER TABLE ""Projects"" ADD COLUMN ""_new_Id"" character varying(8);
                UPDATE ""Projects"" SET ""_new_Id"" = RIGHT(""Slug"", 8);
                ALTER TABLE ""Projects"" ALTER COLUMN ""_new_Id"" SET NOT NULL;

                ALTER TABLE ""Polls"" ADD COLUMN ""_new_Id"" character varying(8);
                UPDATE ""Polls"" SET ""_new_Id"" = RIGHT(""Slug"", 8);
                ALTER TABLE ""Polls"" ALTER COLUMN ""_new_Id"" SET NOT NULL;

                ALTER TABLE ""Options"" ADD COLUMN ""_new_Id"" character varying(8);
                UPDATE ""Options"" SET ""_new_Id"" = RIGHT(""Slug"", 8);
                ALTER TABLE ""Options"" ALTER COLUMN ""_new_Id"" SET NOT NULL;

                ALTER TABLE ""OptionMetas"" ADD COLUMN ""_new_Id"" character varying(8);
                UPDATE ""OptionMetas"" SET ""_new_Id"" = (
                    SELECT RIGHT(o.""Slug"", 8) FROM ""Options"" o WHERE o.""Id"" = ""OptionMetas"".""Id"");
                ALTER TABLE ""OptionMetas"" ALTER COLUMN ""_new_Id"" SET NOT NULL;
            ");

            // Step 2: add temp FK columns for dependent tables, populated via join to slug suffix
            migrationBuilder.Sql(@"
                ALTER TABLE ""Polls"" ADD COLUMN ""_new_ProjectId"" character varying(8);
                UPDATE ""Polls"" SET ""_new_ProjectId"" = (
                    SELECT RIGHT(proj.""Slug"", 8) FROM ""Projects"" proj WHERE proj.""Id"" = ""Polls"".""ProjectId"");
                ALTER TABLE ""Polls"" ALTER COLUMN ""_new_ProjectId"" SET NOT NULL;

                ALTER TABLE ""Options"" ADD COLUMN ""_new_PollId"" character varying(8);
                UPDATE ""Options"" SET ""_new_PollId"" = (
                    SELECT RIGHT(p.""Slug"", 8) FROM ""Polls"" p WHERE p.""Id"" = ""Options"".""PollId"");
                ALTER TABLE ""Options"" ALTER COLUMN ""_new_PollId"" SET NOT NULL;

                ALTER TABLE ""Comments"" ADD COLUMN ""_new_PollId"" character varying(8);
                UPDATE ""Comments"" SET ""_new_PollId"" = (
                    SELECT RIGHT(p.""Slug"", 8) FROM ""Polls"" p WHERE p.""Id"" = ""Comments"".""PollId"");
                ALTER TABLE ""Comments"" ALTER COLUMN ""_new_PollId"" SET NOT NULL;

                ALTER TABLE ""Votes"" ADD COLUMN ""_new_OptionId"" character varying(8);
                UPDATE ""Votes"" SET ""_new_OptionId"" = (
                    SELECT RIGHT(o.""Slug"", 8) FROM ""Options"" o WHERE o.""Id"" = ""Votes"".""OptionId"");
                ALTER TABLE ""Votes"" ALTER COLUMN ""_new_OptionId"" SET NOT NULL;

                ALTER TABLE ""Permissions"" ADD COLUMN ""_new_ProjectKey"" character varying(8);
                UPDATE ""Permissions"" SET ""_new_ProjectKey"" = (
                    SELECT RIGHT(proj.""Slug"", 8) FROM ""Projects"" proj WHERE proj.""Id"" = ""Permissions"".""ProjectKey"");
                ALTER TABLE ""Permissions"" ALTER COLUMN ""_new_ProjectKey"" SET NOT NULL;
            ");

            // Step 3: drop FK constraints before touching PK columns
            // Note: Polls.ProjectId FK kept its original Topics-era name after table rename
            migrationBuilder.Sql(@"
                ALTER TABLE ""Polls"" DROP CONSTRAINT ""FK_Topics_Projects_ProjectId"";
                ALTER TABLE ""Options"" DROP CONSTRAINT ""FK_Options_Polls_PollId"";
                ALTER TABLE ""Comments"" DROP CONSTRAINT ""FK_Comments_Polls_PollId"";
                ALTER TABLE ""Votes"" DROP CONSTRAINT ""FK_Votes_Options_OptionId"";
                ALTER TABLE ""OptionMetas"" DROP CONSTRAINT ""FK_OptionMetas_Options_Id"";
                ALTER TABLE ""Permissions"" DROP CONSTRAINT ""FK_Permissions_Projects_ProjectKey"";
            ");

            // Step 4: drop PK constraints before dropping PK columns
            // Note: Polls PK kept its Topics-era name (PK_Topics) after the table rename
            migrationBuilder.Sql(@"
                ALTER TABLE ""Projects"" DROP CONSTRAINT ""PK_Projects"";
                ALTER TABLE ""Polls"" DROP CONSTRAINT ""PK_Topics"";
                ALTER TABLE ""Options"" DROP CONSTRAINT ""PK_Options"";
                ALTER TABLE ""OptionMetas"" DROP CONSTRAINT ""PK_OptionMetas"";
                ALTER TABLE ""Permissions"" DROP CONSTRAINT ""PK_Permissions"";
            ");

            // Step 5: drop indexes that span columns we're about to drop
            migrationBuilder.Sql(@"
                DROP INDEX ""IX_Projects_Slug"";
                DROP INDEX ""IX_Polls_Slug"";
                DROP INDEX ""IX_Options_Slug"";
                DROP INDEX ""IX_Polls_ProjectId"";
                DROP INDEX ""IX_Options_PollId"";
                DROP INDEX ""IX_Comments_PollId"";
                DROP INDEX ""IX_Votes_OptionId"";
                DROP INDEX ""IX_Permissions_ProjectKey"";
                DROP INDEX ""IX_Permissions_PersonKey_ProjectKey"";
            ");

            // Step 6: drop old columns
            migrationBuilder.Sql(@"
                ALTER TABLE ""Projects"" DROP COLUMN ""Id"";
                ALTER TABLE ""Projects"" DROP COLUMN ""Slug"";
                ALTER TABLE ""Polls"" DROP COLUMN ""Id"";
                ALTER TABLE ""Polls"" DROP COLUMN ""Slug"";
                ALTER TABLE ""Polls"" DROP COLUMN ""ProjectId"";
                ALTER TABLE ""Options"" DROP COLUMN ""Id"";
                ALTER TABLE ""Options"" DROP COLUMN ""Slug"";
                ALTER TABLE ""Options"" DROP COLUMN ""PollId"";
                ALTER TABLE ""OptionMetas"" DROP COLUMN ""Id"";
                ALTER TABLE ""Comments"" DROP COLUMN ""PollId"";
                ALTER TABLE ""Votes"" DROP COLUMN ""OptionId"";
                ALTER TABLE ""Permissions"" DROP COLUMN ""ProjectKey"";
            ");

            // Step 7: rename temp columns to final names
            migrationBuilder.Sql(@"
                ALTER TABLE ""Projects"" RENAME COLUMN ""_new_Id"" TO ""Id"";
                ALTER TABLE ""Polls"" RENAME COLUMN ""_new_Id"" TO ""Id"";
                ALTER TABLE ""Polls"" RENAME COLUMN ""_new_ProjectId"" TO ""ProjectId"";
                ALTER TABLE ""Options"" RENAME COLUMN ""_new_Id"" TO ""Id"";
                ALTER TABLE ""Options"" RENAME COLUMN ""_new_PollId"" TO ""PollId"";
                ALTER TABLE ""OptionMetas"" RENAME COLUMN ""_new_Id"" TO ""Id"";
                ALTER TABLE ""Comments"" RENAME COLUMN ""_new_PollId"" TO ""PollId"";
                ALTER TABLE ""Votes"" RENAME COLUMN ""_new_OptionId"" TO ""OptionId"";
                ALTER TABLE ""Permissions"" RENAME COLUMN ""_new_ProjectKey"" TO ""ProjectKey"";
            ");

            // Step 8: restore PK constraints
            migrationBuilder.Sql(@"
                ALTER TABLE ""Projects"" ADD CONSTRAINT ""PK_Projects"" PRIMARY KEY (""Id"");
                ALTER TABLE ""Polls"" ADD CONSTRAINT ""PK_Polls"" PRIMARY KEY (""Id"");
                ALTER TABLE ""Options"" ADD CONSTRAINT ""PK_Options"" PRIMARY KEY (""Id"");
                ALTER TABLE ""OptionMetas"" ADD CONSTRAINT ""PK_OptionMetas"" PRIMARY KEY (""Id"");
                ALTER TABLE ""Permissions"" ADD CONSTRAINT ""PK_Permissions"" PRIMARY KEY (""PersonKey"", ""ProjectKey"");
            ");

            // Step 9: restore FK constraints
            migrationBuilder.Sql(@"
                ALTER TABLE ""Polls"" ADD CONSTRAINT ""FK_Polls_Projects_ProjectId""
                    FOREIGN KEY (""ProjectId"") REFERENCES ""Projects"" (""Id"") ON DELETE CASCADE;
                ALTER TABLE ""Options"" ADD CONSTRAINT ""FK_Options_Polls_PollId""
                    FOREIGN KEY (""PollId"") REFERENCES ""Polls"" (""Id"") ON DELETE CASCADE;
                ALTER TABLE ""Comments"" ADD CONSTRAINT ""FK_Comments_Polls_PollId""
                    FOREIGN KEY (""PollId"") REFERENCES ""Polls"" (""Id"") ON DELETE CASCADE;
                ALTER TABLE ""Votes"" ADD CONSTRAINT ""FK_Votes_Options_OptionId""
                    FOREIGN KEY (""OptionId"") REFERENCES ""Options"" (""Id"") ON DELETE CASCADE;
                ALTER TABLE ""OptionMetas"" ADD CONSTRAINT ""FK_OptionMetas_Options_Id""
                    FOREIGN KEY (""Id"") REFERENCES ""Options"" (""Id"") ON DELETE CASCADE;
                ALTER TABLE ""Permissions"" ADD CONSTRAINT ""FK_Permissions_Projects_ProjectKey""
                    FOREIGN KEY (""ProjectKey"") REFERENCES ""Projects"" (""Id"") ON DELETE CASCADE;
            ");

            // Step 10: restore indexes
            migrationBuilder.Sql(@"
                CREATE INDEX ""IX_Polls_ProjectId"" ON ""Polls"" (""ProjectId"");
                CREATE INDEX ""IX_Options_PollId"" ON ""Options"" (""PollId"");
                CREATE INDEX ""IX_Comments_PollId"" ON ""Comments"" (""PollId"");
                CREATE INDEX ""IX_Votes_OptionId"" ON ""Votes"" (""OptionId"");
                CREATE INDEX ""IX_Permissions_ProjectKey"" ON ""Permissions"" (""ProjectKey"");
                CREATE UNIQUE INDEX ""IX_Permissions_PersonKey_ProjectKey"" ON ""Permissions"" (""PersonKey"", ""ProjectKey"");
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            throw new NotSupportedException("MigrateToStringIds is not reversible — Guid values were discarded.");
        }
    }
}
