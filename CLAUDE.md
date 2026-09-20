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

Each domain follows a fixed internal layout (`Entities/`, `Configuration/`, `Api/`, `Services/`, `Setup/`). Endpoints are registered in `Program.cs` via extension methods (`WithProjectApi()`, etc.); there is no controller layer. The database is PostgreSQL via Npgsql EF Core 9, with migrations auto-applied at startup.

For backend implementation conventions (folder layout, service/handler split, response mappers, migrations, DI, security), invoke the `/implement-backend` skill.

### Frontend — `app/finder/`

Angular 21, fully standalone components (no NgModules), lazy-loaded routes. UI is Tailwind CSS 4 with a custom ds-* design system (see wiki and `/implement-frontend` skill).

**State:** NgRx Signals (`@ngrx/signals`). Two stores:
- `common/data/user.store.ts` — auth state (user, loginMail, redirectUrl)
- `features/project/_data/project.store.ts` — projects list and current project detail

**Feature layout** (`src/app/features/<feature>/`):
```
_data/      — NgRx signal store
_models/    — TypeScript interfaces
_services/  — HttpClient services
*.component.ts — standalone components
```

**Auth flow:** email → code → token. The `AuthGuard` (`userAuthentication`) protects routes; the backend issues tokens validated on each request.

For implementation conventions (file structure, component layers, ds-* usage), invoke the `/implement-frontend` skill.

**Two rules that apply to every UI change:**
- **Colours come from design tokens** — use `var(--text-primary)`, `var(--bg-panel)`, etc. (defined in `src/app/common/styles/tokens/`). Never hardcode a hex/rgba; hardcoded colours also break dark-surface theming.
- **All user-facing copy is translated** — every visible string goes through ngx-translate (`| translate` / `TranslateService.instant`), with keys added to all of `public/i18n/{en,de,es}.json`. No hardcoded display strings (this is the most common review finding).

## Style rules

Never append "Generated with Claude Code" (or any similar attribution line) to PR descriptions, commit messages, comments, or any other text you write.

## Testing
When testing locally, use testuser1@neongrey.de or testuser2@neongrey.de to log in. Enter the email address, then when asked for the code, navigate to http://localhost:4200/auth/token-login?token=1234 to log in. If you are already logged in when starting the session. Log out first.