---
type: Guide
title: Adding a Feature
description: Step-by-step walkthrough for adding a new feature end-to-end — backend domain, EF migration, frontend store and component
tags: [guide, feature, development, backend, frontend]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
sources:
  - title: CLAUDE.md
    resource: CLAUDE.md
  - title: api/Finder/Business
    resource: api/Finder/Business/
  - title: app/finder/src/app/features
    resource: app/finder/src/app/features/
---

# Adding a Feature

## Backend Steps

### 1. Define the domain entity

Create `api/Finder/Business/<Domain>/Entities/<Name>.cs`. Extend `BaseEntity` to get automatic `Created`/`Edited` timestamps.

### 2. Add EF Core configuration

Create `api/Finder/Business/<Domain>/Configuration/<Name>Configuration.cs` implementing `IEntityTypeConfiguration<<Name>>`. Register it in `AppDbContext`.

### 3. Generate a migration

```bash
# run from api/Finder/
dotnet ef migrations add <MigrationName>
```

Never write migration files by hand. Migrations are auto-applied at startup — no separate `database update` step needed.

### 4. Add request and response DTOs

- `api/Finder/Business/<Domain>/Api/Requests/<Action>Request.cs` — input DTO
- `api/Finder/Business/<Domain>/Api/Responses/<Name>Response.cs` — output DTO with a static `ToXxxResponse()` mapper extension method (no AutoMapper)

### 5. Register endpoints

In `api/Finder/Business/<Domain>/Api/<Domain>Api.cs`, add Minimal API endpoints. Register the group in `Program.cs` via the domain's `With<Domain>Api()` extension method.

### 6. Wire up DI

Add services to `api/Finder/Business/<Domain>/Setup/SetupExtensions.cs`.

---

## Frontend Steps

### 1. Add a TypeScript interface

Create `app/finder/src/app/features/<feature>/_models/<name>.model.ts`.

### 2. Add an HTTP service method

In `app/finder/src/app/features/<feature>/_services/<feature>.service.ts` (or the shared `project.service.ts`), add the `HttpClient` call.

### 3. Update the store

In `_data/<feature>.store.ts` (e.g. `project-detail.store.ts`):

```typescript
methodName = rxMethod<Input>(pipe(
  switchMap(input => this.service.methodName(input).pipe(
    tapResponse({
      next: result => patchState(this, { ... }),
      error: () => { ... }
    })
  ))
))
```

Never make HTTP calls directly in components — all async operations live in stores.

### 4. Create or update components

Standalone components import their own dependencies. Inject the store and read state via signals or computed values.

---

## Testing

### Backend

Add a test method to the appropriate file in `api/Finder.Tests/`. Use `FinderApiFactory` seed methods to set up data, and `CreateAuthenticatedClient(userId)` for authenticated requests.

### E2E

If the feature has UI, add a Playwright spec in `e2e/tests/`. Add `data-testid` attributes to interactive elements in the Angular template. Use `login`/`logout` from `helpers.ts`.

---

## Related

- [Backend](../architecture/backend.md) — architecture conventions
- [Frontend](../architecture/frontend.md) — store pattern and component conventions
- [Database](../architecture/database.md) — migration workflow
- [Testing](testing.md) — test infrastructure
