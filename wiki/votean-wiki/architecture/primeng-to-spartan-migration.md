---
type: Architecture
title: PrimeNG → Spartan UI Migration
description: Decision record and migration overview for replacing PrimeNG with Spartan UI + Tailwind CSS 4
tags: [frontend, spartan-ui, primeng, tailwind, angular, migration, architecture-decision]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-06
sources:
  - title: Migration issue #141
    resource: https://github.com/theneongrey/finder/issues/141
---

# PrimeNG → Spartan UI Migration

## Why

PrimeNG changed its licensing model and is **no longer open source or usable for commercial projects**. The project could not continue using it as its component library.

Spartan UI was chosen as the replacement for three reasons:

1. **Open source** — Apache-licensed, no commercial restrictions.
2. **Composable and Tailwind-native** — components ship as locally-generated source files (`helm/`) on top of headless `@spartan-ng/brain` primitives, making them easy to read, modify, and style with Tailwind CSS 4.
3. **Long-term foundation** — the combination of Spartan UI + Tailwind CSS 4 is a better architectural fit for an Angular 21 standalone-component project than a pre-styled, black-box library like PrimeNG.

## Scope

24 PrimeNG components were replaced across the frontend. The migration was tracked in [issue #141](https://github.com/theneongrey/finder/issues/141) and split into 9 phases ordered from lowest to highest risk:

| Phase | Components | Risk |
|-------|-----------|------|
| 1 — Utilities & Loaders | Skeleton, ProgressSpinner | Low |
| 2 — Display Atoms | Divider, Tag/Badge, Avatar | Low |
| 3 — Form Primitives | Textarea, InputText, InputGroup | Medium |
| 4 — Feedback & Messaging | Message → Alert, Toast → Sonner, ProgressBar | Medium |
| 5 — Navigation & Overlays | Tabs, Menu → DropdownMenu, Popover, Tooltip | Medium |
| 6 — Forms: Select & OTP | Select, SelectButton → ToggleGroup, InputOtp | Medium |
| 7 — Complex Components | Card, Panel, Button (66 uses), Drawer → Sheet, ConfirmDialog → AlertDialog, DatePicker | High |
| 8 — Design System Cleanup | Remove all PrimeNG text references from design-system page | — |
| 9 — Teardown & Wiki | Remove PrimeNG package + config, update wiki | — |

Each phase ended with a Playwright verification step before the next began. All 10 sub-issues were completed.

## Outcome

After the migration:

- Zero `primeng` or `@primeng` imports remain in `src/`.
- `primeng` and `@primeng/themes` are removed from `package.json`.
- No `providePrimeNG` call exists in `app.config.ts`.
- The PrimeNG theme preset (`common/theme/ngprime.preset.ts`) was deleted.
- Spartan components are generated locally into `app/finder/src/lib/ui/` and imported via `@spartan-ng/helm/*` path aliases in `tsconfig.json`.

## How Spartan UI Works

Unlike PrimeNG (a pre-styled black-box npm package), Spartan UI components are **generated into the project as source files**:

```
app/finder/src/lib/ui/
  button/src/index.ts
  card/src/index.ts
  ...
```

Each component folder is aliased in `tsconfig.json`:

```json
"@spartan-ng/helm/button": ["./src/lib/ui/button/src/index.ts"]
```

This means the styled component code lives in the repository — it can be read and modified directly, and it is styled with the project's own Tailwind tokens.

The headless logic (`@spartan-ng/brain`) remains an npm dependency and handles accessibility and behaviour without imposing any styles.

## Related

- [Frontend Architecture](frontend.md)
- [Adding Spartan Components](../guides/adding-spartan-components.md)
- [Design System](../guides/design-system.md)
