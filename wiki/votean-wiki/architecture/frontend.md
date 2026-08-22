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
  common/         — global stores, auth guard, shared UI, i18n, theme
  features/
    auth/         — login, code entry, token login
    project/      — projects, polls, voting, results
    home/         — landing page
    logout/       — logout handler
    settings/     — user profile settings
```

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
- `/auth/*` — unauthenticated; handles all login flows
- `/p/:projectId` — unauthenticated; public project/poll access
- `/project/*` — protected; dashboard, project detail, voting, results
- `/settings` — protected; user profile

Poll-specific routes under `/project/detail/:projectId`:
- `/vote/:pollId` — swipe-based voting
- `/results/:pollId` — vote results with counts
- `/poll-overview/:pollId` — options without results (pre-results hub)

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

**Spartan UI + Tailwind CSS 4.** Spartan components (`@spartan-ng/brain` + project-local `@spartan-ng/helm/*` aliases) are imported individually per component. PrimeNG was removed in 2026 after it changed its licensing model and became no longer open source or usable for commercial projects — see [PrimeNG → Spartan Migration](primeng-to-spartan-migration.md) for the full decision record. See [Adding Spartan Components](../guides/adding-spartan-components.md) for how to install new component primitives.

## Related

- [Backend](backend.md) — API consumed by this app
- [Authentication](../features/auth.md) — AuthGuard, UserStore, login flow
- [Permissions](../features/permissions.md) — role-based UI visibility
- [Polling](../features/polling.md) — vote component, revote mode, skip logic
