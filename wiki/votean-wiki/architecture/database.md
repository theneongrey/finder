---
type: Architecture
title: Database
description: PostgreSQL via Npgsql EF Core 9 — auto-applied migrations, BaseEntity timestamps, hard deletes, SQLite for tests
tags: [database, postgresql, efcore, migrations]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: AppDbContext
    resource: api/Finder/AppDbContext.cs
  - title: api/Finder/Business/*/Configuration/
    resource: api/Finder/Business/
  - title: FinderApiFactory (test setup)
    resource: api/Finder.Tests/Infrastructure/FinderApiFactory.cs
---

# Database

PostgreSQL accessed via Npgsql EF Core 9. Each domain registers its entity configuration in `Business/<Domain>/Configuration/` using `IEntityTypeConfiguration<T>`.

## BaseEntity

Every entity extends `BaseEntity`, which provides `Created` and `Edited` timestamps. `AppDbContext.SaveChangesAsync()` automatically sets these on every write — no manual timestamp management needed in services.

## Auto-Migration

Migrations live in `api/Finder/Migrations/` and are applied automatically at startup via `Database.Migrate()`. No manual `dotnet ef database update` step is needed in production or development.

To generate a new migration after entity changes:

```bash
dotnet ef migrations add <MigrationName>   # run from api/Finder/
```

## Delete Strategy

There is no soft-delete pattern. Records are removed with `ExecuteDeleteAsync()`, which generates a direct `DELETE` SQL statement and cascades as configured in EF relationships.

## Permission Composite Key

The `Permission` entity uses a composite primary key `(PersonKey, ProjectKey)` enforced with a unique index. This guarantees one role record per (user, project) pair.

## Testing Database

Backend tests use SQLite in-memory rather than PostgreSQL:

- Connection string format: `Mode=Memory;Cache=Shared;<unique-name>`
- Each test class gets a unique database name (`Guid.NewGuid()`)
- The same `AppDbContext` and migrations run against SQLite, keeping test and production schema in sync

## Related

- [Backend](backend.md) — EF Core configuration, `AppDbContext`, service queries
- [Testing](../guides/testing.md) — SQLite setup in `FinderApiFactory`
