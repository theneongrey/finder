# Project Guidelines & Standards

This document provides project conventions, environment commands, and architecture rules for the Finder/Votean project. Detailed workflows and skills are defined in individual skill files under `.junie/skills/`.

---

## 1. Quick Commands & Environment

### Backend (C# / ASP.NET Core 9) — `api/Finder/`
- Build: `dotnet build`
- Run: `dotnet run`
- Add Migration: `dotnet ef migrations add <MigrationName>` (always use tooling, never hand-write migration files)
- Apply Migration: `dotnet ef database update` (migrations also auto-apply on startup via `Database.Migrate()`)

### Frontend (Angular 21) — `app/finder/`
- Install: `npm install`
- Start dev server: `npm start` (serves with proxy forwarding API calls to `http://localhost:5192`)
- Build: `npm run build`
- Lint: `npm run lint`
- Unit Tests: `npm test`

### Local Test Authentication
- Credentials: `testuser1@neongrey.de` or `testuser2@neongrey.de`
- Auth bypass code URL: `http://localhost:4200/auth/token-login?token=1234`
- If already logged in when starting a test session, log out first.

---

## 2. Architecture & Domain Structure

### Backend Layout (`api/Finder/`)
- Feature-based domain structure under `Business/<Domain>/`:
  - `Auth/` — magic-link email login, login tokens, allowed email list
  - `Project/` — projects, topics, options, voting
  - `Permission/` — per-project permissions (Voter / Maintainer / Owner)
  - `Shared/` — `BaseEntity` (auto-sets `Created`/`Edited` in `AppDbContext.SaveChangesAsync`), shared services
- Standard Domain Subfolders:
  - `Entities/` — domain models (must inherit `BaseEntity`)
  - `Configuration/` — EF Core `IEntityTypeConfiguration<T>`
  - `Api/Requests/` — request DTOs
  - `Api/Responses/` — response DTOs + static `ToXxxResponse()` extension mapper methods (no AutoMapper)
  - `Api/<Domain>Api.cs` — Minimal API endpoint registration (no controller layer; registered in `Program.cs` via `With<Domain>Api()`)
  - `Services/` — business logic (endpoints must delegate logic to services)
  - `Setup/` — DI extension methods (e.g. `AddProjectServices`)
- Database: PostgreSQL via Npgsql EF Core 9. Migrations live in `Migrations/`.

### Frontend Layout (`app/finder/`)
- Standalone Angular 21 components (no NgModules), lazy-loaded routes, Tailwind CSS 4.
- State Management: NgRx Signals (`@ngrx/signals`).
  - `common/data/user.store.ts` — auth state (user, loginMail, redirectUrl)
  - `features/project/_data/project.store.ts` — projects list and current project detail
- Feature Layout (`src/app/features/<feature>/`):
  - `_data/` — NgRx signal store (`rxMethod` + `switchMap` + `tapResponse`; all async side effects live in stores)
  - `_models/` — TypeScript interfaces
  - `_services/` — `HttpClient` services
  - `*.component.ts` / `*.component.html` — standalone components

---

## 3. Skills Index

Individual skill standards and step-by-step procedures are organized in `.junie/skills/`:

- **Frontend Development:**
  - [`implement-frontend`](skills/implement-frontend/SKILL.md) — Angular 21 component rules, `@ds/*` design system, signal conventions, Tailwind styling, and design handoff matching.
- **End-to-End Testing:**
  - [`e2e`](skills/e2e/SKILL.md) — Playwright test conventions, authentication helpers, and `data-testid` template tagging.
- **Issue Management:**
  - [`create-issue`](skills/create-issue/SKILL.md) — GitHub issue authoring, implementation plans, and sub-issue breakdown.
  - [`implement-issue`](skills/implement-issue/SKILL.md) — End-to-end issue workflow (plan → branch → code → commits → PR).
- **Code Review & Pull Requests:**
  - [`review-pr`](skills/review-pr/SKILL.md) — Automated structural checks across Angular, CSS, backend domains, and tests.
  - [`fix-pr`](skills/fix-pr/SKILL.md) — Interactive one-by-one resolution of PR review findings.
  - [`improve-pr`](skills/improve-pr/SKILL.md) — Categorizing feedback (Apply / Argue / Explain) and executing review changes.
- **Wiki & Knowledge Base:**
  - [`wiki`](skills/wiki/SKILL.md) — Open Knowledge Format (OKF) maintenance, relative markdown linking, and ingest/query/lint workflows.
