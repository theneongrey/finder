---
type: Guide
title: Adding Spartan Components
description: How to install and use new Spartan UI (hlm) component primitives in the frontend
tags: [frontend, spartan-ui, tailwind, angular, guide]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-06
stale_after: 2027-02-06
sources:
  - title: PrimeNG → Spartan migration issue
    resource: https://github.com/theneongrey/finder/issues/141
  - title: Spartan UI CLI docs
    resource: https://www.spartan.ng/documentation/cli
---

# Adding Spartan Components

The project uses [Spartan UI](https://www.spartan.ng) — open-source, composable, and Tailwind-native — as its component library. Components are generated locally into `app/finder/src/lib/ui/` and path-aliased under `@spartan-ng/helm/*` in `tsconfig.json`.

## Background

PrimeNG was the original component library. It was replaced in 2026 after PrimeNG changed its licensing model and became no longer open source or usable for commercial projects. The full migration is tracked in issue #141.

## Prerequisites

The Spartan CLI must be installed once per project:

```bash
cd app/finder
npm install -D @spartan-ng/cli
```

`@spartan-ng/brain` (the headless primitives) is already listed in `dependencies`. If npm rejects the install due to peer dependency version mismatches with Angular CDK, add `--legacy-peer-deps`:

```bash
npm install @spartan-ng/brain --legacy-peer-deps
```

## Adding a Component

```bash
cd app/finder
ng g @spartan-ng/cli:ui <component-name>
```

The CLI copies styled Helm files into `src/lib/ui/<component-name>/` and adds a path alias to `tsconfig.json`:

```json
"@spartan-ng/helm/<component-name>": ["./src/lib/ui/<component-name>/src/index.ts"]
```

After generation, import the component in your standalone component's `imports` array:

```typescript
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  imports: [HlmButton],
  ...
})
```

## Available Components

All installed components have path aliases in `tsconfig.json`. Current set:

| Alias | Component |
|---|---|
| `@spartan-ng/helm/button` | `HlmButton` |
| `@spartan-ng/helm/badge` | `HlmBadge` |
| `@spartan-ng/helm/card` | `HlmCard`, `HlmCardContent`, etc. |
| `@spartan-ng/helm/input` | `HlmInput` |
| `@spartan-ng/helm/input-group` | `HlmInputGroup` |
| `@spartan-ng/helm/textarea` | `HlmTextarea` |
| `@spartan-ng/helm/select` | `HlmSelect`, `HlmSelectContent`, etc. |
| `@spartan-ng/helm/toggle-group` | `HlmToggleGroup`, `HlmToggleGroupItem` |
| `@spartan-ng/helm/tabs` | `HlmTabs`, `HlmTabsList`, etc. |
| `@spartan-ng/helm/alert` | `HlmAlert` |
| `@spartan-ng/helm/alert-dialog` | `HlmAlertDialog`, etc. |
| `@spartan-ng/helm/sheet` | `HlmSheet` (Drawer replacement) |
| `@spartan-ng/helm/popover` | `HlmPopover` |
| `@spartan-ng/helm/tooltip` | `HlmTooltip` |
| `@spartan-ng/helm/dropdown-menu` | `HlmDropdownMenu` |
| `@spartan-ng/helm/avatar` | `HlmAvatar` |
| `@spartan-ng/helm/separator` | `HlmSeparator` |
| `@spartan-ng/helm/skeleton` | `HlmSkeleton` |
| `@spartan-ng/helm/spinner` | `HlmSpinner` |
| `@spartan-ng/helm/progress` | `HlmProgress` |
| `@spartan-ng/helm/sonner` | `HlmToaster` (toast notifications) |
| `@spartan-ng/helm/input-otp` | `HlmInputOtp` |
| `@spartan-ng/helm/date-picker` | `HlmDatePicker` |
| `@spartan-ng/helm/calendar` | `HlmCalendar` |

## Related

- [Frontend Architecture](../architecture/frontend.md)
- [Design System](design-system.md)
