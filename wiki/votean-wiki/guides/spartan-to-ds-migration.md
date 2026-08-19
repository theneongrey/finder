---
type: Guide
title: Spartan → ds-* Migration
description: Mapping table and patterns for migrating components from Spartan UI (Hlm*) to the custom ds-* library
tags: [frontend, ui, angular, spartan-ui, design-system, migration]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-15
stale_after: 2027-02-15
sources:
  - title: ds-* component library implementation — issue #237
    resource: https://github.com/theneongrey/finder/issues/237
  - title: Component source directory
    resource: app/finder/src/app/common/ui/ds-components/
---

# Spartan → ds-* Migration Guide

As of issue #237, all Spartan UI (`Hlm*`) imports have been removed from the
shared component layer and replaced by Votean's own `ds-*` component library.
This page is the canonical reference for the one-to-one mapping.

> **Do not add new `Hlm*` imports.** Spartan UI is still present as a package
> dependency but is no longer in use. It will be fully removed in a future
> cleanup issue.

---

## Import mapping

All ds-* imports use the `ds-components/` directory:

| Old Spartan import | New ds-* import |
|---|---|
| `HlmButtonDirective` from `@spartan-ng/helm/button` | `DsButtonComponent` from `common/ui/ds-components/button/ds-button.component` |
| `HlmBadgeDirective` from `@spartan-ng/helm/badge` | `DsBadgeComponent` from `common/ui/ds-components/badge/ds-badge.component` |
| `HlmCardImports` from `@spartan-ng/helm/card` | `DsCardComponent` from `common/ui/ds-components/card/ds-card.component` |
| `HlmInputDirective` from `@spartan-ng/helm/input` | `DsInputComponent` from `common/ui/ds-components/input/ds-input.component` |
| `HlmTextarea` from `@spartan-ng/helm/textarea` | `DsTextareaComponent` from `common/ui/ds-components/textarea/ds-textarea.component` |
| `HlmTabsImports` from `@spartan-ng/helm/tabs` | `DsTabsComponent` from `common/ui/ds-components/tabs/ds-tabs.component` |
| `HlmAvatarImports` from `@spartan-ng/helm/avatar` | `DsAvatarComponent` from `common/ui/ds-components/avatar/ds-avatar.component` |
| `HlmSkeletonImports` from `@spartan-ng/helm/skeleton` | `DsPollCardSkeletonComponent` or native `<div class="ds-skeleton">` |
| `HlmProgressImports` from `@spartan-ng/helm/progress` | `DsProgressBarComponent` from `common/ui/ds-components/progress-bar/ds-progress-bar.component` |
| `HlmDropdownMenuImports` from `@spartan-ng/helm/dropdown-menu` | `DsMenuComponent` from `common/ui/ds-components/menu/ds-menu.component` |
| `HlmSheetImports` from `@spartan-ng/helm/sheet` | `DsBottomSheetComponent` from `common/ui/ds-components/bottom-sheet/ds-bottom-sheet.component` |
| `HlmSwitch` from `@spartan-ng/helm/switch` | `DsSwitchComponent` from `common/ui/ds-components/switch/ds-switch.component` |
| `HlmToggleGroupImports` from `@spartan-ng/helm/toggle-group` | `DsSegmentedControlComponent` from `common/ui/ds-components/segmented-control/ds-segmented-control.component` |
| `HlmInputOtpImports` + `BrnInputOtp` | `DsInputOtpComponent` from `common/ui/ds-components/input-otp/ds-input-otp.component` |

---

## Pattern migrations

### Button

**Before:**
```typescript
import { HlmButtonDirective } from '@spartan-ng/helm/button';

@Component({ imports: [HlmButtonDirective] })
```
```html
<button hlmBtn>Weiter</button>
<button hlmBtn variant="outline">Abbrechen</button>
```

**After:**
```typescript
import { DsButtonComponent } from '../../common/ui/ds-components/button/ds-button.component';

@Component({ imports: [DsButtonComponent] })
```
```html
<ds-button>Weiter</ds-button>
<ds-button variant="outline">Abbrechen</ds-button>

<!-- Icon-only circular button (no separate ds-icon-button component) -->
<ds-button variant="dark" icon="close" [size]="32" />
```

Note: There is no separate `ds-icon-button` component. Pass a pixel number to
`size` on `ds-button` to get a round icon-only button.

---

### Card

**Before:**
```typescript
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({ imports: [HlmCardImports] })
```
```html
<div hlmCard>
  <div hlmCardContent>…</div>
</div>
```

**After:**
```typescript
import { DsCardComponent } from '../../common/ui/ds-components/card/ds-card.component';

@Component({ imports: [DsCardComponent] })
```
```html
<ds-card>…</ds-card>
```

---

### Avatar

**Before (`user-avatar` component):**
```typescript
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
// colour picked from a simple 6-slot array by index
```
```html
<hlm-avatar>
  <span hlmAvatarFallback [style.background]="color">{{ initial }}</span>
</hlm-avatar>
```

**After:**
```typescript
import { DsAvatarComponent } from '../../common/ui/ds-components/avatar/ds-avatar.component';
// colour from 8-slot person palette via deterministic nameHash()
```
```html
<ds-avatar [initial]="initial" [bg]="bg" [fg]="fg" [size]="size" />
```

The `nameHash()` function (`user-avatar.component.ts`) maps a user's display name to one of the 8 `--person-{n}-bg/fg` pairs deterministically. The palette is defined in `_colors.css`.

---

### Input

**Before:**
```typescript
import { HlmInput } from '@spartan-ng/helm/input';
```
```html
<input hlmInput type="text" placeholder="…" />
```

**After:**
```typescript
import { DsInputComponent } from '../../common/ui/ds-components/input/ds-input.component';
```
```html
<ds-input type="text" label="Titel" placeholder="…" [formControl]="ctrl" />
```

---

### Textarea

**Before:**
```typescript
import { HlmTextarea } from '@spartan-ng/helm/textarea';
```
```html
<textarea hlmTextarea rows="3"></textarea>
```

**After:**
```typescript
import { DsTextareaComponent } from '../../common/ui/ds-components/textarea/ds-textarea.component';
```
```html
<ds-textarea label="Beschreibung" [rows]="3" [formControl]="ctrl" />
```

---

### Switch

**Before:**
```typescript
import { HlmSwitch } from '@spartan-ng/helm/switch';
```
```html
<hlm-switch [checked]="value" (checkedChange)="value = $event" />
```

**After:**
```typescript
import { DsSwitchComponent } from '../../common/ui/ds-components/switch/ds-switch.component';
```
```html
<ds-switch [(checked)]="value" />
<!-- or with reactive forms -->
<ds-switch [formControl]="ctrl" />
```

---

### OTP input

**Before:**
```typescript
import { BrnInputOtp } from '@spartan-ng/brain/input-otp';
import { HlmInputOtpImports } from '@spartan-ng/helm/input-otp';
```

**After:**
```typescript
import { DsInputOtpComponent } from '../../common/ui/ds-components/input-otp/ds-input-otp.component';
```
```html
<ds-input-otp [length]="6" [groupSize]="3" [formControl]="codeControl" />
```

---

### Skeleton (loading state)

**Before:**
```typescript
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';

@Component({ imports: [HlmSkeletonImports] })
```
```html
<hlm-skeleton class="h-4 w-full" />
```

**After (poll card skeleton):**
```typescript
import { DsPollCardSkeletonComponent } from '../../common/ui/ds-components/poll-card-skeleton/ds-poll-card-skeleton.component';
```
```html
<ds-poll-card-skeleton [count]="3" />
```

**After (generic inline skeleton):**

No component import needed. Use a plain `<div>` styled with the `ds-skeleton` class:
```html
<div class="ds-skeleton" style="height: 16px; width: 100%;"></div>
```

---

### Dropdown menu

**Before:**
```typescript
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
```
```html
<brn-menu #menu>
  <button hlmBtn brnMenuTrigger [brnMenuTriggerFor]="menu">Settings</button>
  <hlm-menu>
    <hlm-menu-item routerLink="/settings">Settings</hlm-menu-item>
    <hlm-menu-item (click)="logout()">Logout</hlm-menu-item>
  </hlm-menu>
</brn-menu>
```

**After:**
```typescript
import { DsMenuComponent } from '../../common/ui/ds-components/menu/ds-menu.component';
import { MenuItem } from '../../common/ui/ds-components/menu/ds-menu.component';
```
```html
<!-- The element inside ds-menu becomes the trigger automatically -->
<ds-menu [items]="menuItems()">
  <ds-button variant="dark" icon="kebab" [size]="32" />
</ds-menu>
```

Items are data-driven (`MenuItem[]`) instead of projected content:
```typescript
menuItems = computed<MenuItem[]>(() => [
  { icon: 'edit', label: 'Settings', onClick: () => this.router.navigate(['/settings']) },
  { icon: 'close', label: 'Logout',  onClick: () => this.router.navigate(['/logout']) },
]);
```

---

### Bottom sheet / drawer

**Before (Spartan Sheet):**
```typescript
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
```
```html
<hlm-sheet>
  <hlm-sheet-trigger hlmBtn>Teilen</hlm-sheet-trigger>
  <hlm-sheet-content side="bottom">…</hlm-sheet-content>
</hlm-sheet>
```

**After:**
```typescript
import { DsBottomSheetComponent } from '../../common/ui/ds-components/bottom-sheet/ds-bottom-sheet.component';

sheetOpen = signal(false);
```
```html
<ds-button (click)="sheetOpen.set(true)">Teilen</ds-button>

@if (sheetOpen()) {
  <ds-bottom-sheet
    title="Teilen"
    [open]="sheetOpen()"
    (dismissed)="sheetOpen.set(false)"
  >
    <!-- sheet content via ng-content -->
  </ds-bottom-sheet>
}
```

Use `@if` so Angular removes the element from the DOM when hidden — not `[hidden]` or `display: none`.

Note: The output is named `dismissed` (not `close`).

---

### Progress bar

**Before:**
```typescript
import { HlmProgressImports } from '@spartan-ng/helm/progress';
```
```html
<hlm-progress [value]="60" />
```

**After:**
```typescript
import { DsProgressBarComponent } from '../../common/ui/ds-components/progress-bar/ds-progress-bar.component';
```
```html
<ds-progress-bar [percent]="60" />
```

Note the input name changed from `value` to `percent`.

---

## e2e helper change

The Playwright `logout()` helper in `e2e/tests/helpers.ts` was updated because
Spartan's `role="menuitem"` attribute is absent from `ds-menu` button elements:

```typescript
// Before (Spartan dropdown — has ARIA role)
await page.getByRole('menuitem', { name: 'Logout' }).click();

// After (ds-menu — plain <button> with CSS class)
await page.locator('.ds-menu-item').filter({ hasText: /logout|abmelden/i }).click();
```

Use `.ds-menu-item` class + locale-agnostic text filter for all future menu-item targeting in e2e tests.

---

## Related Pages

- [Component Library (ds-*)](component-library.md) — full API reference for all 21 ds-* components
- [Design System](design-system.md) — live `/ux` showcase
- [PrimeNG → Spartan migration history](../architecture/primeng-to-spartan-migration.md)
- [Adding Spartan Components (deprecated)](adding-spartan-components.md)
