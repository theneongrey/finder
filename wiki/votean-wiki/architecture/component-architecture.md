---
type: Architecture
title: Component Architecture
description: Three-layer component model — ds-* design system, common smart components, and domain-feature components — with rules for where each lives.
tags: [frontend, angular, components, design-system, architecture]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-13
stale_after: 2027-02-13
sources:
  - title: ds-* component source
    resource: app/finder/src/app/common/ui/ds-components/
  - title: smart-component source
    resource: app/finder/src/app/common/ui/smart-components/
  - title: polls feature source
    resource: app/finder/src/app/features/polls/
  - title: tsconfig path aliases
    resource: app/finder/tsconfig.json
---

# Component Architecture

The Angular frontend uses three distinct component layers. Each layer has a clear definition of what it may and may not know. Placing a component in the wrong layer is the most common source of design drift.

---

## Layer 1 — ds-* Design System Components

**Directory:** `app/finder/src/app/common/ui/ds-components/`  
**Import alias:** `@ds/*`  
**Selectors:** `ds-*`

These are pure presentational primitives. They know nothing about the application domain. Their inputs and outputs use only primitive types (`string`, `number`, `boolean`, generic interfaces with primitive fields).

### What makes something a ds-* component

- Inputs are generic: a label is a `string`, a colour is a CSS variable string, a size is `'sm' | 'md'` or a pixel number
- No imports from `_shared/models/` or any feature directory
- No store or service injection
- Visual behaviour is fully specified by [design tokens](../guides/design-system.md); no hardcoded domain colours or copy
- Wraps Spartan/CDK primitives where interaction is needed (overlay, focus management) but overrides their visual styling completely

### Examples

| Component | Why it is a ds-* |
|-----------|-----------------|
| `ds-button` | Accepts `variant`, `label`, `icon` as strings — no domain meaning |
| `ds-badge` | Accepts `tone` (a generic status word) and label via `ng-content` |
| `ds-avatar` | Accepts `initial`, `bg`, `fg` as raw strings — caller decides colours |
| `ds-vote-buttons` | Outputs four generic events (`yes`, `no`, `skip`, `maybe`) — the name coincidence with the poll domain is irrelevant; the component has no `OptionType` import |
| `ds-menu` | Accepts `MenuItem[]` with generic `icon`, `label`, `onClick` — no domain type |
| `ds-empty-state-button` | Accepts `layout`, `icon`, `label` — the grid tile shape is generic, not poll-specific |

### What disqualifies a component from ds-*

- It imports a domain enum or interface (e.g. `OptionType`, `PollItem`, `User`)
- Its config table is keyed by a domain type (e.g. `Record<OptionType, { icon, label, bg, fg }>`)
- It has hardcoded copy in a specific language (e.g. `'Ja / Nein'`, `'Bewertung'`)
- It derives its colours from a business rule (e.g. "date polls use person-4 palette")

The moment any of these appear, the component belongs in Layer 2 or Layer 3.

---

## Layer 2 — Common Smart Components

**Directory:** `app/finder/src/app/common/ui/smart-components/`  
**Import alias:** `@smart/*`  
**Selectors:** `app-*`

These components know about cross-cutting application models (primarily `User`) and inject global stores or services (`UserStore`, `TitleBarService`). They are used across multiple feature domains — auth, polls, settings, home all display a user avatar and title bar.

### What makes something a common smart component

- Accepts a domain model as input **or** injects a global store/service
- Used by **at least two unrelated feature domains** (auth + polls, or polls + settings, etc.)
- The domain knowledge it carries is application-wide, not feature-specific

### Examples

| Component | What domain knowledge it carries |
|-----------|----------------------------------|
| `user-avatar` | Accepts `User`; derives initials from `user.name`, maps `nameHash(name)` to the 8-colour person palette deterministically |
| `title-bar` | Injects `UserStore` and `TitleBarService`; reads current user, back route, and page title; computes settings/logout menu items |
| `add-card` | Application-level "add new" affordance used across project and poll creation flows |

`user-avatar` is the clearest example of the distinction: `ds-avatar` accepts raw `initial`, `bg`, `fg` strings — the caller must know which colour to use. `user-avatar` accepts a `User` object and derives everything internally. Feature components use `app-user-avatar`, never `ds-avatar` directly when displaying a real user.

---

## Layer 3 — Domain Feature Components

**Directory:** `app/finder/src/app/features/<domain>/`  
**Selectors:** `app-*`

These are components that belong to a specific product feature. They import domain models and enums, may inject feature stores, and render UI specific to one area of the product. They are **never placed in `common/`** — they live where they are used.

### Placement within a feature: `_shared/ui/` vs co-located

The polls feature has two levels:

```
features/polls/
  _shared/
    models/         — domain types (OptionType, PollItem, PollDetail, …)
    data/           — stores and services (PollStore, PollService, …)
    ui/             — components shared across multiple polls sub-features
      poll-item/
      poll-type-badge/
      poll-input/
  overview/         — the polls list view
  detail/
    vote/           — swipe-based voting
    results/        — vote results
    edit/           — poll editing
  add/              — poll creation
```

**Use `_shared/ui/` when the component is used by two or more sub-features of the same domain.**

`poll-type-badge` shows the poll type pill (Termin / Ja / Nein / Bewertung). It is used by `overview/` (the poll card list) and `detail/` (the poll header). It lives in `_shared/ui/`.

`poll-item` (the full poll card with menu) is also used across multiple views. It lives in `_shared/ui/`.

**Co-locate with the sub-feature when it is only ever used there.**

`vote-card-date` renders the date option inside the swipe voting screen. Only `polls/detail/vote/` uses it. It lives directly under `detail/vote/`. If it were moved to `_shared/ui/` it would be a false promise — nothing else uses it and it would pull vote-screen-specific logic into shared territory.

### The single-use rule

> A domain component that is only used in one sub-feature **must** live in that sub-feature's directory, not in `_shared/`.

`_shared/` is not a catch-all for "might be used later." It signals "is already used in multiple places." Putting a single-use component there adds noise and makes the codebase harder to navigate.

---

## Decision Tree

When creating or refactoring a component, work down this list:

```
Does it import a domain type (OptionType, PollItem, User, …)?
├── No  → Is it wrapping a generic interaction (overlay, focus, form)?
│         ├── Yes → ds-* component in common/ui/ds-components/
│         └── No  → ds-* component in common/ui/ds-components/
└── Yes → Does it use domain types from more than one feature,
          or is it used across multiple unrelated feature domains?
          ├── Yes → common smart component in common/ui/smart-components/
          └── No  → domain feature component
                    ├── Used in ≥ 2 sub-features of the same domain?
                    │   └── Yes → features/<domain>/_shared/ui/
                    └── Used in exactly 1 sub-feature?
                        └── co-locate in that sub-feature's directory
```

---

## Real Migrations

### ds-poll-type-badge → app-poll-type-badge (2026-08-13)

`ds-poll-type-badge` was originally a ds-* component accepting a `'yesno' | 'rating' | 'date'` string union. The string union was a shadow of `OptionType`. The component contained:
- `Record<PollTypeBadgeType, { icon, label, bg, fg }>` — a domain config table
- Hardcoded German labels (`'Ja / Nein'`, `'Bewertung'`, `'Termin'`)
- Business-rule colour assignments (date polls use `--person-4` palette)

All three signals indicate a domain component. It was moved to `polls/_shared/ui/poll-type-badge/` and its input changed from the string union to `OptionType` directly. The design-system showcase now imports it from the polls feature.

---

## Path Aliases

```
@ds/*     → app/finder/src/app/common/ui/ds-components/*
@smart/*  → app/finder/src/app/common/ui/smart-components/*
```

Feature components use relative imports within their own domain. There is no alias for `features/`.

---

## Related

- [Frontend Architecture](frontend.md) — overall Angular app structure
- [Component Library (ds-*)](../guides/component-library.md) — ds-* API reference
- [Design System](../guides/design-system.md) — live component showcase at `/ux`
