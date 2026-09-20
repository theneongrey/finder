# Implement Backend Skill

Project-specific conventions and recurring pitfalls for the ASP.NET Core 9 backend (`api/Finder/`). Backend counterpart to `/implement-frontend`. Assumes you already know idiomatic C#/EF — this only covers what's specific to this repo or has bitten past PRs.

---

## Layout

All domain code lives under `Business/<Feature>/` (`Auth`, `Permission`, `Preview`, `Project`, `Shared`, `User`). Each feature uses this fixed layout — put new files in the matching folder, never top-level:

```
Entities/         — models, inherit BaseEntity
Configuration/    — IEntityTypeConfiguration<T> per entity
Api/
  Requests/       — request DTOs
  Responses/      — response DTOs + ToXxxResponse() mappers (same file as the DTO)
  <Feature>Api.cs — Minimal API registration (WithXxxApi() extension)
Services/         — business logic
Setup/            — SetupExtensions.cs (AddXxxServices) + IOptions classes
```

No controllers. Endpoints are Minimal APIs wired in `Program.cs`.

---

## Project conventions

- **Handlers stay thin** — bind, call a service, map, return `Results.*`. No EF queries, mutations, or validation in the endpoint lambda; that logic goes in a `Services/` class. *(Recurred: #367.)*
- **Response mapping** — no AutoMapper. Every response DTO has a `static ToXxxResponse(this Entity …)` extension in its own file.
- **DI** — register services in the feature's `Setup/SetupExtensions.cs` (`AddXxxServices`), not scattered in `Program.cs`.
- **Entities** inherit `BaseEntity`; `Created`/`Edited` are set automatically by `AppDbContext` — never by hand.
- **Migrations** — always `dotnet ef migrations add <Name>` (never hand-written). They auto-apply via `Database.Migrate()`; never `EnsureCreated()`.
- **Config** — bind via strongly-typed `IOptions<T>` classes in `Setup/`.

---

## Recurring pitfalls

- **SQLite tests vs Postgres** — the app runs on PostgreSQL, tests on SQLite. A provider-specific mapping (e.g. `jsonb`) breaks SQLite tests; add a value converter so both work. *(#388)*
- **Set-based EF** — use `ExecuteDeleteAsync` / `ExecuteUpdateAsync`; don't load a collection into memory just to `RemoveRange`/count it. *(#367)*
- **HTML-encode user input** — project/user/recipient/free-text values written into email or notification templates must go through `System.Net.WebUtility.HtmlEncode(value)`. *(#358)*
- **Multi-language templates** (`Business/Shared/Templates/{en,de,es}/`) — when you touch one, translate all three fully. The `en/` file must be entirely English (`lang="en"`, `<title>Finder</title>`, English preheader/badge/body/CTA); German remnants or a stale app name ship visibly wrong. *(#358)*
- **No bare `!`** — don't null-forgive to silence a warning; use an explicit fallback (`?? []`, `?? throw …`) that documents intent, or comment why null is impossible. *(#388)*
- **Service dependency direction** — a general orchestrator (`*NotificationService`) triggers specialized senders (`*MailService`), not the reverse. *(#367)*

---

## Before done

```bash
cd api/Finder
dotnet format    # required before committing
dotnet build
dotnet test      # includes the SQLite-backed tests
```
