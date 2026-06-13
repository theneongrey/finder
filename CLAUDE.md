# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (C# / ASP.NET Core 9)
Run from `api/Finder/`:
```bash
dotnet build
dotnet run
dotnet ef migrations add <MigrationName>   # generate migration — always use tooling, not manual files
dotnet ef database update                  # migrations also auto-apply on startup
```

### Frontend (Angular)
Run from `app/finder/`:
```bash
npm install
npm start        # ng serve with proxy — API calls forwarded to http://localhost:5192
npm run build
npm run lint
npm test
```

## Architecture

### Backend — `api/Finder/`

Feature-based domain structure under `Business/`:
- `Auth/` — magic-link email login, login tokens, allowed-email list
- `Project/` — projects, topics, options, voting
- `Permission/` — per-project permissions (Voter / Maintainer / Owner)
- `Shared/` — `BaseEntity` (auto-sets `Created`/`Edited` in `AppDbContext.SaveChangesAsync`), shared services

Each domain follows this internal layout:
```
Entities/         — domain models
Configuration/    — EF Core IEntityTypeConfiguration
Api/
  Requests/       — request DTOs
  Responses/      — response DTOs + mapper extension methods (ToXxxResponse)
  <Domain>Api.cs  — Minimal API endpoint registration
Services/         — business logic
Setup/            — DI extension method (e.g. AddProjectServices)
```

Endpoints are registered in `Program.cs` via extension methods (`WithProjectApi()`, etc.). There is no controller layer.

**Database:** PostgreSQL via Npgsql EF Core 9. Migrations live in `Migrations/` and are auto-applied at startup via `Database.Migrate()`.

**Response mapping:** No AutoMapper — each response type has a static `ToXxxResponse()` extension method in the `Responses/` file alongside the DTO class.

### Frontend — `app/finder/`

Angular 21, fully standalone components (no NgModules), lazy-loaded routes.
When told to use a primeng component use app\finder\primngllms.txt as reference.
When calling the backend, don't do it directly in the component. Use a store as a layer inbetween.

**State:** NgRx Signals (`@ngrx/signals`). There are two stores:
- `common/data/user.store.ts` — auth state (user, loginMail, redirectUrl)
- `features/project/_data/project.store.ts` — projects list and current project detail

Store methods use `rxMethod` + `switchMap` + `tapResponse`. All async side effects live in stores, not components.

**Feature layout** (`src/app/features/<feature>/`):
```
_data/      — NgRx signal store
_models/    — TypeScript interfaces
_services/  — HttpClient services
*.component.ts — standalone components
```

**UI:** PrimeNG 21 + Tailwind CSS 4.
Use primngllms.txt for help to primeng components.

**Auth flow:** email → code → token. The `AuthGuard` (`userAuthentication`) protects routes; the backend issues tokens validated on each request.
