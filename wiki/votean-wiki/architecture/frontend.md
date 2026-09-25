---
type: Architecture
title: Frontend
description: Angular 21 — standalone components, NgRx Signals store-first state, lazy-loaded routes, event-driven sharing sync
tags: [frontend, angular, ngrx, signals, standalone, spartan-ui, tailwind]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: app/finder/src/app
    resource: app/finder/src/app/
  - title: project-detail.store.ts
    resource: app/finder/src/app/features/project/_shared/data/project-detail.store.ts
  - title: project-list.store.ts
    resource: app/finder/src/app/features/project/_shared/data/project-list.store.ts
  - title: user.store.ts
    resource: app/finder/src/app/common/data/user.store.ts
---

# Frontend

Angular 21 application with fully standalone components (no NgModules) and NgRx Signals for state management. Routes are lazy-loaded.

## Feature Layout

```
src/app/
  common/         — global stores, auth guard, shared UI (ds-*), i18n, theme
  features/
    auth/         — login, code entry, token login
    polls/        — overview, single-step add wizard, detail (results + voting overlay)
    public-poll/  — unauthenticated /p/:projectId access
    home/         — language redirect + landing page
    legal/        — privacy + imprint pages
    settings/     — user profile settings
    design-system/— /ux live component reference (dev only)
    logout/       — logout handler
```

> **Note:** the poll feature was reorganised in the 2026 rebuild — `features/project/…`
> became `features/polls/…`, and `public-poll` moved to the app level. See the
> [Poll Detail Page Rebuild](poll-detail-rebuild.md) for the full story.

## Store Architecture

Three NgRx Signals stores manage all application state. Components read from stores; all async operations live in store methods — never in components.

| Store | Scope | Manages |
|-------|-------|---------|
| `UserStore` | global (root) | Auth state, current user, language/date format |
| `ProjectListStore` | global (root) | Projects list, standalone polls list, active overview tab |
| `ProjectDetailStore` | global (root) | Current project detail, current poll detail |

### Store Pattern

```typescript
// All async operations use:
methodName = rxMethod<Input>(pipe(
  switchMap(input => this.service.call(input).pipe(
    tapResponse({
      next: result => patchState(this, { ... }),
      error: () => { ... }
    })
  ))
))
```

No separate effects layer. No actions/reducers. State is patched directly inside `tapResponse`.

## Routing

All protected routes are wrapped by `userAuthentication` (AuthGuard). On failure the guard stores the attempted URL in `UserStore` and redirects to `/auth/request-email`, so the user is returned to the original destination after signing in.

Key route groups:
- `/` — language redirect; `/de`, `/en`, `/es` — landing page per locale
- `/auth/*` — unauthenticated; handles all login flows
- `/privacy`, `/imprint` — unauthenticated legal pages
- `/p/:projectId` — unauthenticated; public poll access
- `/ux` — dev-only design-system reference (`devOnly` guard)
- `/polls/*` — protected; poll overview, create, detail
- `/settings` — protected; user profile

Poll routes under the protected `/polls` shell (`PollsShellComponent`):
- `/polls` — poll overview / list
- `/polls/add` — single-step create wizard
- `/polls/:id/:pollId` — poll detail (results grid); voting runs as an overlay on this
  page, not a separate route

The old `/vote`, `/results`, and `/poll-overview` routes were removed in the 2026 rebuild —
see [Poll Detail Page Rebuild](poll-detail-rebuild.md).

## Standalone Components

Every component declares its own `imports: []` array. There is no shared module. This makes the dependency graph explicit and enables fine-grained tree-shaking.

## Event-Driven Sharing Sync

Sharing/permission changes are broadcast via `sharingEvents`. Both `ProjectListStore` and `ProjectDetailStore` subscribe to these events via `withEventReducer` and update their local state independently. This keeps both the overview and the detail view in sync without direct store-to-store communication.

## Internationalization

`@ngx-translate` with JSON translation files. The user's language is stored on the `Person` entity (backend) and read into `UserStore` on login. Computed signals in `UserStore` derive locale-specific date formats:

| Language | Date format |
|----------|------------|
| en | `M/d/yyyy` |
| de | `dd.MM.yyyy` |
| es | `dd/MM/yyyy` |

## Component Layers

The UI is split into three layers — see [Component Architecture](component-architecture.md) for the full decision rules and examples.

| Layer | Directory | Selector | Domain knowledge |
|-------|-----------|----------|-----------------|
| ds-* design system | `common/ui/ds-components/` (`@ds/*`) | `ds-*` | None — generic primitive types only |
| Common smart | `common/ui/smart-components/` (`@smart/*`) | `app-*` | Cross-cutting (User, global stores) |
| Domain feature | `features/<domain>/…` | `app-*` | Feature-specific models and stores |

Within a feature, components shared across sub-features live in `_shared/ui/`; single-use components are co-located with the sub-feature that owns them.

## UI Library

**Custom `ds-*` design system on top of Spartan UI + Tailwind CSS 4.** The app is built from
project-local `ds-*` standalone components (`common/ui/ds-components/`, `@ds/*`), which wrap
Spartan primitives (`@spartan-ng/brain` + `@spartan-ng/helm/*`) with the Votean visual
language. No PrimeNG (removed in 2026 after a licensing change — see
[PrimeNG → Spartan Migration](primeng-to-spartan-migration.md)) and no raw `Hlm*` imports in
feature code.

ds-* components follow a **Tailwind-first styling convention**: styling lives as Tailwind
utility classes in the template, and a `.component.css` file survives only for rules Tailwind
cannot express (`@keyframes`, pseudo-elements, Spartan `[data-state]`/`::after` overrides,
complex `@media` positioning). See [Styling ds-* Components](../guides/styling-ds-components.md)
for the full convention and [Component Library (ds-*)](../guides/component-library.md) for the
API reference.

## Related

- [Backend](backend.md) — API consumed by this app
- [Authentication](../features/auth.md) — AuthGuard, UserStore, login flow
- [Permissions](../features/permissions.md) — role-based UI visibility
- [Polling](../features/polling.md) — vote component, revote mode, skip logic
