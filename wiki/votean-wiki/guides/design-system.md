---
type: Guide
title: Design System
description: Live component and token reference available at /ux in development builds
tags: [frontend, ui, design, angular, spartan-ui, tailwind]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-04
sources:
  - title: design-system component
    resource: app/finder/src/app/features/design-system/design-system.component.ts
  - title: global styles
    resource: app/finder/src/styles.css
---

# Design System

The design system is a live Angular route at `/ux` that documents the visual language and component library used in Votean. It is only accessible in development builds — navigating to `/ux` in production redirects to `/`.

## Accessing It

Run the frontend in development mode and open:

```
http://localhost:4200/ux
```

The route is guarded by `devOnly` (`common/services/dev-only.guard.ts`), which checks `environment.environment === 'development'`.

## What It Covers

| Section | Contents |
|---|---|
| **Colors** | Brand token swatches (`--color-primary`, etc.) and Spartan semantic scale |
| **Typography** | Live h1/h2/h3/body/label samples with size and weight annotations |
| **Spacing & Tokens** | Border radius, gap scale, button padding variants |
| **Buttons** | All variants × filled / outlined / ghost / destructive / link; sizes; icon variants |
| **Badge** | `hlmBadge` severity variants |
| **Forms** | Input, InputGroup, Select, ToggleGroup, Textarea, AutoResizeTextarea, OTP |
| **Cards** | `hlmCard` and the custom `AddCardComponent` |
| **Navigation** | Interactive tabs demo |
| **Feedback** | Alert (all severities), ProgressBar, Spinner, Skeleton, Sonner toast |
| **Overlays** | ShareDrawer (Sheet), AlertDialog, Popover |
| **Data Display** | Avatar (sizes), AvatarGroup, Separator |
| **Icons** | Font Awesome Free 7 sample grid |
| **Suggestions** | Documented gaps in the current design system |

## Design Tokens

Tokens are CSS custom properties defined in `styles.css` under `@theme` and applied globally:

| Token | Value | Role |
|---|---|---|
| `--color-primary` | `#4797bf` | Main brand blue |
| `--color-primary-dark` | `#397999` | Hover / active state |
| `--color-secondary` | `#627d8b` | Secondary text and borders |
| `--color-tertiary` | `#e8af63` | Warm accent |
| `--color-error` | `#ad3448` | Validation errors |
| `--color-neutral` | `#1a1c1e` | Near-black text |
| `--color-on-surface-variant` | `#404944` | Muted text on surfaces |

## Typography

Font: **Plus Jakarta Sans** (weights 300, 400, 500, 700), loaded via `@fontsource/plus-jakarta-sans`.

| Element | Size | Line Height | Weight |
|---|---|---|---|
| `h1` | 20px | 1.4 | 400 |
| `h2` | 24px | 1.3 | 700 |
| `h3` | 16px | 20px | 700 |
| `p.label-sm` | 14px | 1.2 | 400 |

## Icon Library

[Font Awesome Free 7](https://fontawesome.com) is the app's icon library. Use `fa-solid`, `fa-regular`, and `fa-brands` prefixes with icon names from the Font Awesome catalog.

## Known Gaps

The Suggestions section of `/ux` flags eight areas not yet covered by the design system:

1. **Z-index scale** — ad-hoc values; no semantic levels defined
2. **Transition duration tokens** — 150–300ms values scattered without tokens
3. **Elevation / shadow tokens** — `shadow-md/lg/xl` applied ad-hoc
4. **Text color tokens** — muted/disabled text uses Tailwind gray defaults, not named tokens
5. **Dark mode** — no `prefers-color-scheme` support
6. **Responsive breakpoints** — used but not documented
7. **Focus ring token** — `outline-primary` not a first-class CSS property
8. **Semantic status colors** — no `--color-success` / `--color-warning` alongside `--color-error`

## Related Pages

- [Frontend Architecture](../architecture/frontend.md)
- [Local Setup](local-setup.md)
