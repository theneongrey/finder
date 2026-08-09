---
type: Guide
title: Design System
description: Live component and token reference available at /ux in development builds
tags: [frontend, ui, design, angular, design-system, tokens]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-10
stale_after: 2027-02-10
sources:
  - title: design-system component
    resource: app/finder/src/app/features/design-system/design-system.component.ts
  - title: design tokens
    resource: app/finder/src/app/common/styles/tokens/
  - title: ds-* component library — issue #237
    resource: https://github.com/theneongrey/finder/issues/237
---

# Design System

The design system is a live Angular route at `/ux` that documents the visual language and component library used in Votean. It is only accessible in development builds — navigating to `/ux` in production redirects to `/`.

## Accessing It

Run the frontend in development mode and open:

```
http://localhost:4200/ux
```

The route is guarded by `devOnly` (`common/services/dev-only.guard.ts`), which checks `environment.environment === 'development'`.

## What It Covers (18 sections)

| Section | Contents |
|---|---|
| **Colors** | All design token colour swatches — cream/sand neutrals, ink neutrals, teal brand, semantic status, and the 8-slot person palette |
| **Typography** | Live h1/h2/h3 headings; display scale (xl→3xs); body scale (lg→tiny); font metrics |
| **Spacing** | `--space-1` through `--space-24` bar visualisation |
| **Shadows** | Five named shadow tokens rendered on white cards |
| **Icons** | All 23 `ds-icon` glyphs in a labelled grid |
| **Buttons** | All 5 `ds-button` variants × normal / icon / loading / fullWidth |
| **Icon Buttons** | All 3 `ds-icon-button` variants |
| **Avatars** | `ds-avatar` sizes; `ds-avatar-stack` with overflow bubble |
| **Badges** | All 7 `ds-badge` tones; `ds-status-dot` tones |
| **Cards** | `ds-card` default and `accentBorder` variants |
| **Inputs** | `ds-input` text/date/time types, label, error state |
| **Progress** | `ds-progress-bar` at 0 / 35 / 75 / 100% |
| **Segmented Control** | `ds-segmented-control` — interactive, reads out selected value |
| **Tabs** | `ds-tabs` — interactive, reads out active tab |
| **Bottom Sheet** | `ds-bottom-sheet` — trigger button; scrim-dismiss |
| **Menu** | `ds-menu` — trigger button; scrim-dismiss |
| **Empty State Buttons** | `ds-empty-state-button` row and tile layouts |
| **Vote Buttons** | `ds-vote-buttons` trio |

## Design Tokens

Tokens are CSS custom properties defined under `app/finder/src/app/common/styles/tokens/`:

| File | Contents |
|---|---|
| `_colors.css` | Cream/sand neutrals, ink scale, teal brand, semantic status, person palette, semantic surface/text/border aliases |
| `_typography.css` | `--fs-display-*`, `--fs-body-*`, `--font-display`, `--font-body` |
| `_spacing.css` | `--space-1` … `--space-24` (2px–48px) |
| `_effects.css` | `--shadow-*`, `--radius-*`, `--z-*` |

### Key colour tokens

| Token | Hex | Role |
|---|---|---|
| `--accent` (= `--teal-900`) | `#1f7a8c` | Primary brand teal |
| `--accent-tint` (= `--teal-150`) | `#e7f2f3` | Tinted teal background |
| `--ink-900` | `#1d2227` | Primary text |
| `--ink-600` | `#5a5650` | Secondary text |
| `--cream-100` | `#f7f5f1` | App background |
| `--positive` | `#4f7a4a` | Success / open status |
| `--negative` | `#c1453f` | Error / rejection |
| `--person-1-bg/fg` … `--person-8-bg/fg` | — | 8-slot deterministic avatar palette |

### Typography

Font: **Geist Sans** (regular + medium) for display text; **Geist Mono** for code, loaded via `@fontsource/geist` and `@fontsource/geist-mono`.

| Scale | Token | Size |
|---|---|---|
| Display | `--fs-display-xl` | 33px |
| Display | `--fs-display-lg` | 30px |
| Display | `--fs-display-md` | 27px |
| Display | `--fs-display-sm` | 24px |
| Body | `--fs-body` | 15px |
| UI | `--fs-ui` | 13.5px |
| Caption | `--fs-caption` | 12.5px |

## Component Library

The UI is built on 15 custom `ds-*` Angular standalone components in
`app/finder/src/app/common/ui/components/`. See the [Component Library reference](component-library.md) for the full API.

**Components:** `ds-icon`, `ds-button`, `ds-icon-button`, `ds-avatar`, `ds-avatar-stack`, `ds-badge`, `ds-status-dot`, `ds-card`, `ds-input`, `ds-progress-bar`, `ds-segmented-control`, `ds-tabs`, `ds-bottom-sheet`, `ds-menu`, `ds-empty-state-button`, `ds-vote-buttons`

No Spartan UI (`Hlm*`) or Font Awesome imports are used. All icons are inline SVGs rendered by `ds-icon`.

## Related Pages

- [Component Library (ds-*)](component-library.md) — selector, inputs, outputs, usage examples for all 15 components
- [Spartan → ds-* Migration Guide](spartan-to-ds-migration.md) — mapping from old Hlm* imports
- [Frontend Architecture](../architecture/frontend.md)
- [Local Setup](local-setup.md)
