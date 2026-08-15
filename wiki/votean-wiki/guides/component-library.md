---
type: Guide
title: Component Library (ds-*)
description: API reference for all 21 custom ds-* Angular design-system components
tags: [frontend, ui, angular, design-system, components]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-15
stale_after: 2027-02-15
sources:
  - title: Component library implementation — issue #237
    resource: https://github.com/theneongrey/finder/issues/237
  - title: Component source directory
    resource: app/finder/src/app/common/ui/ds-components/
---

# Component Library (ds-*)

Votean's UI is built on 21 custom Angular standalone components that live in
`app/finder/src/app/common/ui/ds-components/`. They are purely presentational
(inputs/outputs only, no store or service injection) and driven entirely by
[CSS design tokens](design-system.md).

All components use `ChangeDetectionStrategy.OnPush` and Angular's signal-based
`input()` / `output()` / `model()` APIs.

For a live visual preview, open [`/ux`](design-system.md) in development mode.

---

## ds-icon

**Selector:** `<ds-icon>`
**File:** `icon/ds-icon.component.ts`
**Exports:** `DsIconComponent`, `ICON_NAMES`

Renders one of 29 custom inline SVGs. No external icon font is used.

| Input | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | *(required)* | Icon identifier (see catalogue below) |
| `size` | `number` | `18` | Width and height in px |
| `color` | `string` | `'currentColor'` | SVG stroke/fill colour |

**Icon catalogue (29 names):**

| Name | Glyph description |
|---|---|
| `logo` | Votean check-mark logo |
| `chevron-left` | Left-pointing chevron |
| `chevron-right` | Right-pointing chevron |
| `arrow-right` | Horizontal arrow with arrowhead |
| `kebab` | Three vertical dots (filled) |
| `comment` | Speech bubble |
| `share` | Three nodes connected by lines |
| `edit` | Pencil |
| `trash` | Trash can |
| `lock` | Padlock |
| `users` | Two silhouettes |
| `calendar` | Calendar grid |
| `clock` | Clock face |
| `refresh` | Circular arrows |
| `play` | Filled triangle (filled) |
| `send` | Paper plane (filled) |
| `trophy` | Trophy cup |
| `close` | × cross |
| `check` | ✓ tick |
| `heart` | Heart outline |
| `grid` | 2×2 rounded squares |
| `folder` | Folder outline |
| `checklist` | Square with inner tick |
| `plus` | + sign |
| `circle-dot` | Circle with filled centre dot |
| `search` | Magnifying glass |
| `mail` | Envelope |
| `info` | Circle with lowercase i |
| `globe` | Globe with latitude/longitude lines |

```html
<ds-icon name="heart" [size]="20" color="var(--accent)" />
```

---

## ds-button

**Selector:** `<ds-button>`
**File:** `button/ds-button.component.ts`

Text button and icon-only circular button in one component. Pass a pixel number
to `size` to get a round icon button; pass `'sm'` or `'md'` (default) for a
standard labelled button.

| Input | Type | Default | Description |
|---|---|---|---|
| `variant` | `ButtonVariant` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| number` | `'md'` | `'sm'`/`'md'` for text buttons; px diameter for icon-only circular button |
| `icon` | `string \| undefined` | `undefined` | Leading icon name (from `ds-icon`) |
| `trailingIcon` | `string \| undefined` | `undefined` | Trailing icon name |
| `label` | `string \| undefined` | `undefined` | Button label (alternative to ng-content) |
| `color` | `string \| undefined` | `undefined` | Custom foreground colour override |
| `fullWidth` | `boolean` | `false` | Stretch to 100% width |
| `loading` | `boolean` | `false` | Shows spinner; disables interaction |
| `disabled` | `boolean` | `false` | Dims to 50% opacity |
| `noGlow` | `boolean` | `true` | Suppress the coloured drop-shadow on `primary` |

Use native `(click)` on the host element — no custom output.

```html
<!-- Standard text button -->
<ds-button variant="primary" icon="refresh" [fullWidth]="true" (click)="submit()">
  Weiter abstimmen
</ds-button>

<!-- Icon-only circular button (36 px diameter) -->
<ds-button variant="dark" icon="close" [size]="36" (click)="dismiss()" />

<!-- Small ghost -->
<ds-button variant="ghost" size="sm">Alle ansehen</ds-button>
```

**Variant guide:**

| Variant | Use |
|---|---|
| `primary` | One main CTA per screen; teal fill with coloured shadow |
| `dark` | Secondary strong action (e.g. "Teilen") |
| `outline` | Lower-emphasis action on white backgrounds |
| `subtle` | Subdued/resolved states (e.g. "Ergebnisse") |
| `ghost` | Inline text link; no padding or background |
| `neutral` | Neutral surface action; uses `--bg-panel` background |
| `surface` | White card surface button |
| `teal` | Brand teal with lighter fill than `primary` |
| `soft` | Soft teal tint background |
| `danger` | Destructive action; red colouring |

---

## ds-avatar

**Selector:** `<ds-avatar>`
**File:** `avatar/ds-avatar.component.ts`

Round initials avatar. `bg`/`fg` should come from the 8-colour person palette
(`--person-1-bg/fg` … `--person-8-bg/fg`). When `voted` is provided, a voting
state ring or dashed border is rendered.

| Input | Type | Default | Description |
|---|---|---|---|
| `initial` | `string` | *(required)* | Single character to display |
| `bg` | `string` | `'var(--person-1-bg)'` | Circle background colour |
| `fg` | `string` | `'var(--person-1-fg)'` | Initials text colour |
| `size` | `'sm' \| 'md' \| 'lg' \| number` | `'md'` | sm=27px, md=34px, lg=38px, or explicit px |
| `voted` | `boolean \| undefined` | `undefined` | `undefined`=no voting context; `true`=voted (solid ring + check badge); `false`=pending (dashed border) |

```html
<ds-avatar initial="G" bg="var(--person-3-bg)" fg="var(--person-3-fg)" size="lg" />
<ds-avatar initial="A" [voted]="true" />
<ds-avatar initial="B" [voted]="false" />
```

---

## ds-avatar-stack

**Selector:** `<ds-avatar-stack>`
**File:** `avatar-stack/ds-avatar-stack.component.ts`

Overlapping row of avatars with an optional "+N" overflow bubble and an "add" button.

| Input | Type | Default | Description |
|---|---|---|---|
| `avatars` | `AvatarItem[]` | `[]` | `{ initial, bg, fg, voted? }` objects |
| `max` | `number` | `4` | Maximum avatars shown before overflow |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Avatar diameter |
| `showAdd` | `boolean` | `false` | Show dashed "+" add button at end |
| `addLabel` | `string` | `'Add member'` | Accessible label for the add button |

| Output | Type | Description |
|---|---|---|
| `addClicked` | `void` | Fires when the "+" add button is clicked |

```typescript
// AvatarItem interface
interface AvatarItem {
  initial: string;
  bg: string;
  fg: string;
  voted?: boolean; // undefined=no context; true=voted; false=pending
}
```

```html
<ds-avatar-stack
  [avatars]="members"
  [max]="4"
  [showAdd]="canInvite"
  addLabel="Mitglied einladen"
  (addClicked)="openInvite()"
/>
```

---

## ds-badge

**Selector:** `<ds-badge>`
**File:** `badge/ds-badge.component.ts`

Small pill badge for counts, roles, and status labels.

| Input | Type | Default | Description |
|---|---|---|---|
| `tone` | `BadgeTone` | `'neutral'` | Colour preset |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | sm=micro text 20px min-height; md=standard; lg=caption text 26px min-height |
| `icon` | `string \| undefined` | `undefined` | Leading icon name |

`BadgeTone` values: `accent` `neutral` `warning` `viewer` `contributor` `manager` `success`

```html
<ds-badge tone="manager">Manager</ds-badge>
<ds-badge tone="accent" icon="trophy" size="sm">Meiste Stimmen</ds-badge>
```

---

## ds-status-dot

**Selector:** `<ds-status-dot>`
**File:** `badge/ds-status-dot.component.ts`

Inline pill with a leading coloured dot. Use inside labels or next to headings to
show poll open/closed state.

| Input | Type | Default | Description |
|---|---|---|---|
| `tone` | `'positive' \| 'muted'` | `'positive'` | Green dot (open) or grey dot (closed) |

```html
<ds-status-dot tone="positive">Läuft</ds-status-dot>
<ds-status-dot tone="muted">Beendet</ds-status-dot>
```

---

## ds-card

**Selector:** `<ds-card>`
**File:** `card/ds-card.component.ts`

White surface card — the foundation for poll cards, project cards, and most grouped content.

| Input | Type | Default | Description |
|---|---|---|---|
| `padding` | `number` | `20` | Internal padding in px |
| `accentBorder` | `boolean` | `false` | Adds 4px left teal border instead of hairline border |

```html
<ds-card [accentBorder]="true">
  <h3>Kartenüberschrift</h3>
  <p>Inhalt …</p>
</ds-card>
```

---

## ds-chip

**Selector:** `<ds-chip>`
**File:** `chip/ds-chip.component.ts`

Toggleable filter chip with optional icon. Uses `model()` for two-way active state binding.

| Input | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | *(required)* | Chip label text |
| `icon` | `string \| undefined` | `undefined` | Optional icon before the label |
| `active` | `boolean` (model) | `false` | Two-way active/inactive state |

```html
<!-- Standalone toggle -->
<ds-chip label="Favoriten" icon="heart" [(active)]="showFavourites" />

<!-- Read the value in parent -->
<ds-chip label="Erledigt" [(active)]="doneFilter" />
@if (doneFilter()) { … }
```

---

## ds-input

**Selector:** `<ds-input>`
**File:** `input/ds-input.component.ts`

Text/date/time input. Implements `ControlValueAccessor` — works with Angular reactive forms.

| Input | Type | Default | Description |
|---|---|---|---|
| `type` | `'text' \| 'date' \| 'time'` | `'text'` | HTML input type |
| `label` | `string \| undefined` | `undefined` | Label shown above the field |
| `error` | `string \| undefined` | `undefined` | Error message shown below; also adds red border |
| `placeholder` | `string` | `''` | Placeholder text |
| `background` | `string` | `'var(--bg-input)'` | Field background colour |
| `readonly` | `boolean` | `false` | Makes the field read-only |

```html
<!-- Standalone -->
<ds-input type="text" label="Titel" placeholder="Titel eingeben…" />

<!-- With reactive forms -->
<ds-input [formControl]="titleControl" label="Titel" [error]="titleError()" />

<!-- Date picker -->
<ds-input type="date" label="Datum" [formControl]="dateControl" />
```

---

## ds-textarea

**Selector:** `<ds-textarea>`
**File:** `textarea/ds-textarea.component.ts`

Multi-line text input. Implements `ControlValueAccessor`. Supports auto-resize to content height.

| Input | Type | Default | Description |
|---|---|---|---|
| `label` | `string \| undefined` | `undefined` | Label shown above the field |
| `error` | `string \| undefined` | `undefined` | Error message shown below |
| `placeholder` | `string` | `''` | Placeholder text |
| `rows` | `number` | `3` | Initial number of visible rows |
| `maxlength` | `number \| null` | `null` | Maximum character count |
| `autoResize` | `boolean` | `false` | Grow height to fit content automatically |
| `maxHeight` | `string` | `'200px'` | Max height when `autoResize` is true |

| Output | Type | Description |
|---|---|---|
| `blurred` | `void` | Fires when the textarea loses focus |

```html
<ds-textarea
  label="Beschreibung"
  placeholder="Beschreibung eingeben…"
  [autoResize]="true"
  maxHeight="300px"
  [formControl]="descControl"
/>
```

---

## ds-input-otp

**Selector:** `<ds-input-otp>`
**File:** `input-otp/ds-input-otp.component.ts`

OTP / verification-code input with grouped digit boxes. Implements `ControlValueAccessor`.

| Input | Type | Default | Description |
|---|---|---|---|
| `length` | `number` | `6` | Total number of digits |
| `groupSize` | `number` | `3` | Digits per visual group (separated by a dash) |

```html
<!-- 6-digit OTP in two groups of 3 -->
<ds-input-otp [formControl]="codeControl" />

<!-- 4-digit PIN, no grouping -->
<ds-input-otp [length]="4" [groupSize]="4" [formControl]="pinControl" />
```

---

## ds-switch

**Selector:** `<ds-switch>`
**File:** `switch/ds-switch.component.ts`

On/off toggle. Implements `ControlValueAccessor` and `model()` for two-way binding.

| Input | Type | Default | Description |
|---|---|---|---|
| `size` | `'sm' \| 'md'` | `'md'` | Physical size of the toggle |
| `checked` | `boolean` (model) | `false` | Two-way checked state |

```html
<!-- Two-way binding -->
<ds-switch [(checked)]="notificationsEnabled" />

<!-- Reactive forms -->
<ds-switch [formControl]="notifControl" />
```

---

## ds-progress-bar

**Selector:** `<ds-progress-bar>`
**File:** `progress-bar/ds-progress-bar.component.ts`

Teal fill bar with cream track — used for "3 von 5 bewertet".

| Input | Type | Default | Description |
|---|---|---|---|
| `percent` | `number` | *(required)* | 0–100; clamped automatically |
| `height` | `number` | `9` | Track height in px |

```html
<ds-progress-bar [percent]="votedCount / totalCount * 100" />
```

---

## ds-segmented-control

**Selector:** `<ds-segmented-control>`
**File:** `segmented-control/ds-segmented-control.component.ts`

Track-style toggle — visibility picker, role picker, view mode. Uses `model()` for two-way binding.

| Input | Type | Default | Description |
|---|---|---|---|
| `options` | `SegmentOption[]` | *(required)* | `{ value, label, icon? }[]` |
| `value` | `string` (model, required) | — | Currently selected `option.value` |
| `size` | `'sm' \| 'md'` | `'md'` | Compact or standard padding |

```typescript
interface SegmentOption { value: string; label: string; icon?: string; }
```

```html
<ds-segmented-control
  [options]="[{ value: 'open', label: 'Offen' }, { value: 'invite', label: 'Eingeladen' }]"
  [(value)]="visibility"
/>
```

---

## ds-tabs

**Selector:** `<ds-tabs>`
**File:** `tabs/ds-tabs.component.ts`

Underline tab row with optional count chips. Uses `model()` for two-way binding.

| Input | Type | Default | Description |
|---|---|---|---|
| `items` | `TabItem[]` | *(required)* | `{ value, label, count? }[]` |
| `value` | `string` (model, required) | — | Active tab's `value` |
| `size` | `'sm' \| 'md'` | `'md'` | Compact or standard font size |

```typescript
interface TabItem { value: string; label: string; count?: number; }
```

```html
<ds-tabs
  [items]="[{ value: 'overview', label: 'Überblick', count: 3 }, { value: 'members', label: 'Mitglieder' }]"
  [(value)]="activeTab"
/>
```

---

## ds-stepper

**Selector:** `<ds-stepper>`
**File:** `stepper/ds-stepper.component.ts`

Step indicator bar — shows progress through a multi-step form flow.

| Input | Type | Default | Description |
|---|---|---|---|
| `steps` | `number` | *(required)* | Total number of steps |
| `current` | `number` | `1` | 1-based index of the current step |

```html
<!-- Step 2 of 4 -->
<ds-stepper [steps]="4" [current]="2" />
```

---

## ds-bottom-sheet

**Selector:** `<ds-bottom-sheet>`
**File:** `bottom-sheet/ds-bottom-sheet.component.ts`

Fixed overlay that slides from the bottom on mobile. Supports drag-to-dismiss.
Content is projected via `ng-content`.

| Input | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | *(required)* | Sheet heading |
| `subtitle` | `string \| undefined` | `undefined` | Sub-heading below title |
| `open` | `boolean` | `false` | Whether the sheet is open |

| Output | Type | Description |
|---|---|---|
| `dismissed` | `void` | Fires when the close button is clicked or the user drags down to dismiss |

Control visibility with an external signal and `@if` so Angular removes it from the DOM when closed:

```typescript
sheetOpen = signal(false);
```

```html
<ds-button (click)="sheetOpen.set(true)">Teilen</ds-button>

@if (sheetOpen()) {
  <ds-bottom-sheet
    title="Teilen"
    subtitle="Link kopieren oder weiterleiten"
    [open]="sheetOpen()"
    (dismissed)="sheetOpen.set(false)"
  >
    <!-- sheet content via ng-content -->
  </ds-bottom-sheet>
}
```

---

## ds-menu

**Selector:** `<ds-menu>`
**File:** `menu/ds-menu.component.ts`

Floating dropdown anchored to its trigger via `HlmDropdownMenuTrigger`. The trigger element
is provided via `ng-content`.

| Input | Type | Default | Description |
|---|---|---|---|
| `items` | `MenuItem[]` | *(required)* | Menu items (see interface below) |

```typescript
interface MenuItem {
  icon: string;
  label: string;
  danger?: boolean;   // true → renders in red
  onClick: () => void;
}
```

Place any clickable element inside `<ds-menu>` — it becomes the trigger:

```html
<ds-menu [items]="menuItems()">
  <ds-button variant="dark" icon="kebab" [size]="32" />
</ds-menu>
```

```typescript
menuItems = computed<MenuItem[]>(() => [
  { icon: 'edit', label: 'Bearbeiten', onClick: () => this.edit() },
  { icon: 'trash', label: 'Löschen', danger: true, onClick: () => this.delete() },
]);
```

---

## ds-empty-state-button

**Selector:** `<ds-empty-state-button>`
**File:** `empty-state-button/ds-empty-state-button.component.ts`

Dashed-border "add new" affordance in two layouts.

| Input | Type | Default | Description |
|---|---|---|---|
| `layout` | `'row' \| 'tile'` | `'row'` | Full-width row or grid tile |
| `icon` | `string` | `'plus'` | Icon name |
| `label` | `string` | *(required)* | Button label |

| Output | Type | Description |
|---|---|---|
| `clicked` | `void` | Fires on click |

```html
<!-- End-of-list row -->
<ds-empty-state-button layout="row" label="Neues Projekt starten" (clicked)="create()" />

<!-- Poll-type grid tile -->
<ds-empty-state-button layout="tile" label="Datum" icon="calendar" (clicked)="addDate()" />
```

---

## ds-vote-buttons

**Selector:** `<ds-vote-buttons>`
**File:** `vote-buttons/ds-vote-buttons.component.ts`

Yes / Skip / No trio from the date-poll voting screen. An optional fourth "maybe" button
can be shown with `showMaybe`.

| Input | Type | Default | Description |
|---|---|---|---|
| `showMaybe` | `boolean` | `false` | Show a fourth "maybe" button |

| Output | Type | Description |
|---|---|---|
| `yes` | `void` | User tapped the heart button |
| `no` | `void` | User tapped the close button |
| `skip` | `void` | User tapped "Überspringen" |
| `maybe` | `void` | User tapped the "maybe" button (only when `showMaybe` is true) |

```html
<ds-vote-buttons
  [showMaybe]="poll.allowMaybe"
  (yes)="castVote('yes')"
  (no)="castVote('no')"
  (skip)="castVote('skip')"
  (maybe)="castVote('maybe')"
/>
```

---

## ds-poll-card-skeleton

**Selector:** `<ds-poll-card-skeleton>`
**File:** `poll-card-skeleton/ds-poll-card-skeleton.component.ts`

Animated shimmer placeholder shown while poll cards are loading.

| Input | Type | Default | Description |
|---|---|---|---|
| `count` | `number` | `3` | Number of skeleton cards to render |

```html
<ds-poll-card-skeleton [count]="3" />
```

---

## Related Pages

- [Design System showcase](design-system.md) — live `/ux` preview of all components
- [Spartan → ds-* Migration Guide](spartan-to-ds-migration.md) — mapping from old Hlm* imports
- [Frontend Architecture](../architecture/frontend.md)
- [Component Architecture](../architecture/component-architecture.md)
