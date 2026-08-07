---
type: Architecture
title: Projects Concept Removal (MVP Simplification)
description: Decision record for removing the multi-poll Project concept from all user-visible surfaces while preserving the backend data model
tags: [frontend, mvp, architecture-decision, projects, polls, routing, angular]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-07
sources:
  - title: Simplification issue #170
    resource: https://github.com/theneongrey/finder/issues/170
  - title: Route rename issue #174
    resource: https://github.com/theneongrey/finder/issues/174
---

# Projects Concept Removal (MVP Simplification)

## Decision

The multi-poll **Project** concept is removed from all user-visible surfaces: the UI, URLs, Angular feature folder layout, component names, and store file names. The backend data model is fully preserved — only the project CRUD endpoints (`GET/POST/PUT /api/project`) are disabled — so the concept can be re-enabled in the future without any database migrations.

**Date:** 2026-08-06

## Why

1. **Simpler MVP** — Users only need to see and create polls. Introducing an extra layer of named containers (Projects) adds friction before the core value is clear.
2. **Reduced cognitive load** — A single list of polls is easier to understand than polls nested inside projects, especially for first-time users.
3. **Easier polish** — A smaller feature surface can be fully polished and tested before reintroducing project grouping.
4. **Standalone polls cover the primary use case** — The `IsStandalone = true` project pattern already handles single-poll links and sharing. Nothing is lost functionally.

## Scope

The removal touches every user-visible layer:

| Layer | Before | After |
|-------|--------|-------|
| URL prefix | `/project/*` | `/polls/*` |
| Overview URL | `/project/overview` | `/polls` |
| Add poll URL | `/project/add-standalone` | `/polls/add` |
| Poll detail URL | `/project/detail/:id/…` | `/polls/:id/…` |
| Angular feature folder | `features/project/` | `features/polls/` |
| Shell component | `ProjectShellComponent` | `PollsShellComponent` |
| Detail shell | `ProjectSelectedShellComponent` | `PollDetailShellComponent` |
| Store files | `project.store.ts`, `project-detail.store.ts`, `project-list.store.ts` | `poll.store.ts`, `poll-detail.store.ts`, `poll-list.store.ts` |
| Service file | `project.service.ts` | `poll.service.ts` |
| Model files | `project-overview.model.ts`, `project-detail.model.ts`, `project-role.enum.ts` | `poll-overview.model.ts`, `poll-detail.model.ts`, `poll-role.enum.ts` |

The route rename is a **breaking change for any saved or shared links** pointing to `/project/*` paths. No redirect is in place — old links simply 404.

## What Is Preserved

- The backend `Project` entity, `Poll` entities, `Vote` entities, and all relationships remain unchanged in the database.
- `GET /api/project/standalone-polls`, `POST /api/project/standalone-poll`, `DELETE /api/project/{slug}` — still active.
- `GET /api/project/{slug}`, `GET /api/project/public/{slug}` — still active.
- All vote, option, comment, and sharing endpoints — still active.
- Public share links (`/p/:projectId`) — still resolve correctly.

## Disabled Endpoints

The following endpoints return `410 Gone` and are no longer reachable:

| Method | Path | Reason |
|--------|------|--------|
| `GET` | `/api/project` | Lists all projects — no project UI to display them |
| `POST` | `/api/project` | Creates a multi-poll project — no creation UI |
| `PUT` | `/api/project/{slug}` | Updates a project — no edit UI |

## Reintroduction Path

Because the backend data model and project infrastructure are fully intact, reintroducing project grouping requires only:

1. Re-enable the three disabled endpoints in `ProjectApi.cs`.
2. Add project list / create / edit UI components back to `features/polls/` (or a new `features/projects/` folder).
3. Add routes for project management.
4. No database migration is needed.

## Related

- [Project](../concepts/project.md) — domain entity description
- [Frontend Architecture](frontend.md) — Angular feature layout
- [PrimeNG → Spartan UI Migration](primeng-to-spartan-migration.md) — the prior large architecture decision
