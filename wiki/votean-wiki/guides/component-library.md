---
type: Guide
title: Component Library (ds-*)
description: API reference for Votean's 15 custom Angular design-system components that replace Spartan UI
tags: [frontend, ui, angular, design-system, components]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-10
stale_after: 2027-02-10
sources:
  - title: Component library implementation — issue #237
    resource: https://github.com/theneongrey/finder/issues/237
  - title: Component source directory
    resource: app/finder/src/app/common/ui/components/
---

# Component Library (ds-*)

Votean's UI is built on 15 custom Angular standalone components that live in
`app/finder/src/app/common/ui/components/`. They are purely presentational
(inputs/outputs only, no store or service injection) and driven entirely by
[CSS design tokens](design-system.md).

All components use `ChangeDetectionStrategy.OnPush` and Angular's signal-based
`input()` / `output()` / `model()` APIs. No `Hlm*` or Font Awesome imports
appear in any of them.

For a live visual preview, open [`/ux`](design-system.md) in development mode.

---

## ds-icon

**Selector:** `<ds-icon>`  
**File:** `icon/ds-icon.component.ts`  
**Exports:** `DsIconComponent`, `ICON_NAMES`

Renders one of 23 custom inline SVGs. No external icon font is used.

| Input | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | *(required)* | Icon identifier (see catalogue below) |
| `size` | `number` | `18` | Width and height in px |
| `color` | `string` | `'currentColor'` | SVG stroke/fill colour |

**Icon catalogue (23 names):**

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

```html
<ds-icon name="heart" [size]="20" color="var(--accent)" />
```

---

## ds-button

**Selector:** `<ds-button>`  
**File:** `button/ds-button.component.ts`

| Input | Type | Default | Description |
|---|---|---|---|
| `variant` | `'primary' \| 'dark' \| 'outline' \| 'subtle' \| 'ghost'` | `'primary'` | Visual style |
| `icon` | `string \| undefined` | `undefined` | Leading icon name (from `ds-icon`) |
| `fullWidth` | `boolean` | `false` | Stretch to 100% width |
| `loading` | `boolean` | `false` | Shows spinner, disables interaction |
| `disabled` | `boolean` | `false` | Dims to 50% opacity |

Use native `(click)` on the host element — no custom output needed.

```html
<ds-button variant="primary" icon="refresh" [fullWidth]="true" (click)="submit()">
  Weiter abstimmen
</ds-button>

<ds-button variant="ghost">Alle ansehen</ds-button>
```

**Variant guide:**

| Variant | Use |
|---|---|
| `primary` | One main CTA per screen; teal fill with coloured shadow |
| `dark` | Secondary strong action (e.g. "Teilen") |
| `outline` | Lower-emphasis action on white backgrounds |
| `subtle` | Subdued/resolved states (e.g. "Ergebnisse") |
| `ghost` | Inline text link; no padding or background |

---

## ds-icon-button

**Selector:** `<ds-icon-button>`  
**File:** `icon-button/ds-icon-button.component.ts`

Circular icon-only button — back nav, kebab trigger, close button.

| Input | Type | Default | Description |
|---|---|---|---|
| `icon` | `string` | *(required)* | Icon name |
| `variant` | `'surface' \| 'ghost' \| 'dark'` | `'surface'` | Visual style |
| `size` | `number` | `36` | Diameter in px |
| `title` | `string \| undefined` | `undefined` | Accessible label |

```html
<ds-icon-button icon="chevron-left" variant="ghost" (click)="goBack()" title="Zurück" />
<ds-icon-button icon="kebab" variant="surface" (click)="toggleMenu()" />
```

---

## ds-avatar

**Selector:** `<ds-avatar>`  
**File:** `avatar/ds-avatar.component.ts`

Round initials avatar. `bg`/`fg` should come from the 8-colour person palette
(`--person-1-bg/fg` … `--person-8-bg/fg`).

| Input | Type | Default | Description |
|---|---|---|---|
| `initial` | `string` | *(required)* | Single character to display |
| `bg` | `string` | `'var(--person-1-bg)'` | Circle background colour |
| `fg` | `string` | `'var(--person-1-fg)'` | Initials text colour |
| `size` | `'sm' \| 'md' \| 'lg' \| number` | `'md'` | sm=27px, md=34px, lg=38px, or explicit px |
| `ring` | `boolean` | `false` | 2.5px white border ring (for stacked use) |

```html
<ds-avatar initial="G" bg="var(--person-3-bg)" fg="var(--person-3-fg)" size="lg" />
```

---

## ds-avatar-stack

**Selector:** `<ds-avatar-stack>`  
**File:** `avatar-stack/ds-avatar-stack.component.ts`

Overlapping row of avatars with an optional "+N" overflow bubble and an "add" button.

| Input | Type | Default | Description |
|---|---|---|---|
| `avatars` | `AvatarItem[]` | `[]` | `{ initial, bg, fg }` objects |
| `max` | `number` | `4` | Maximum avatars shown before overflow |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Avatar diameter |
| `showAdd` | `boolean` | `false` | Show dashed "+" add button at end |

| Output | Type | Description |
|---|---|---|
| `addClicked` | `void` | Fires when the "+" add button is clicked |

```html
<ds-avatar-stack [avatars]="members" [max]="4" [showAdd]="canInvite" (addClicked)="openInvite()" />
```

---

## ds-badge

**Selector:** `<ds-badge>`  
**File:** `badge/ds-badge.component.ts`

Small pill badge for counts, roles, and status labels.

| Input | Type | Default | Description |
|---|---|---|---|
| `tone` | `BadgeTone` | `'neutral'` | Colour preset |
| `icon` | `string \| undefined` | `undefined` | Leading icon name |

`BadgeTone` values: `accent` `neutral` `warning` `viewer` `contributor` `manager` `success`

```html
<ds-badge tone="manager">Manager</ds-badge>
<ds-badge tone="accent" icon="trophy">Meiste Stimmen</ds-badge>
```

---

## ds-status-dot

**Selector:** `<ds-status-dot>`  
**File:** `badge/ds-status-dot.component.ts`

Inline pill with a leading coloured dot.

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

White surface card — the foundation for ProjectCard, TopicCard, and most grouped content.

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

## ds-input

**Selector:** `<ds-input>`  
**File:** `input/ds-input.component.ts`

Text/date/time input. Implements `ControlValueAccessor` — works with Angular reactive forms and `[(ngModel)]`.

| Input | Type | Default | Description |
|---|---|---|---|
| `type` | `'text' \| 'date' \| 'time'` | `'text'` | HTML input type |
| `label` | `string \| undefined` | `undefined` | Label shown above the field |
| `error` | `string \| undefined` | `undefined` | Error message shown below; also adds red border |
| `placeholder` | `string` | `''` | Placeholder text |
| `background` | `string` | `'var(--bg-input)'` | Field background colour |

```html
<!-- Standalone -->
<ds-input type="text" label="Titel" placeholder="Titel eingeben…" />

<!-- With reactive forms -->
<ds-input [formControl]="titleControl" label="Titel" [error]="titleError()" />
```

---

## ds-progress-bar

**Selector:** `<ds-progress-bar>`  
**File:** `progress-bar/ds-progress-bar.component.ts`

9px teal fill bar with cream track — used for "3 von 5 bewertet".

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

Track-style toggle — visibility picker, role picker, view mode.

| Input | Type | Default | Description |
|---|---|---|---|
| `options` | `SegmentOption[]` | *(required)* | `{ value: string; label: string }[]` |
| `value` | `string` | *(required, two-way)* | Currently selected `option.value` |
| `size` | `'sm' \| 'md'` | `'md'` | Compact or standard padding |

Uses Angular's `model()` — supports `[(value)]` two-way binding.

```html
<ds-segmented-control
  [options]="[{ value: 'open', label: 'Offen' }, { value: 'invite', label: 'Eingeladen' }]"
  [value]="visibility()"
  (valueChange)="visibility.set($event)"
/>
```

---

## ds-tabs

**Selector:** `<ds-tabs>`  
**File:** `tabs/ds-tabs.component.ts`

Underline tab row with optional count chips.

| Input | Type | Default | Description |
|---|---|---|---|
| `items` | `TabItem[]` | *(required)* | `{ value, label, count? }[]` |
| `value` | `string` | *(required, two-way)* | Active tab's `value` |
| `size` | `'sm' \| 'md'` | `'md'` | Compact or standard font size |

```html
<ds-tabs
  [items]="[{ value: 'overview', label: 'Überblick', count: 3 }, { value: 'members', label: 'Mitglieder' }]"
  [value]="activeTab()"
  (valueChange)="activeTab.set($event)"
/>
```

---

## ds-bottom-sheet

**Selector:** `<ds-bottom-sheet>`  
**File:** `bottom-sheet/ds-bottom-sheet.component.ts`

Fixed overlay that slides from the bottom on mobile; renders as a centred modal at ≥ 680 px.

| Input | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | *(required)* | Sheet heading |
| `subtitle` | `string \| undefined` | `undefined` | Sub-heading below title |

| Output | Type | Description |
|---|---|---|
| `close` | `void` | Fires when scrim or close button is clicked |

Always render conditionally so Angular removes it from the DOM when closed:

```html
@if (sheetOpen()) {
  <ds-bottom-sheet title="Teilen" (close)="sheetOpen.set(false)">
    <!-- sheet content -->
  </ds-bottom-sheet>
}
```

---

## ds-menu

**Selector:** `<ds-menu>`  
**File:** `menu/ds-menu.component.ts`

Floating dropdown anchored to its parent. Renders a full-screen scrim for outside-click dismiss.

| Input | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | *(required)* | Whether the menu is visible |
| `items` | `MenuItem[]` | *(required)* | `{ icon, label, danger?, onClick }[]` |

| Output | Type | Description |
|---|---|---|
| `closed` | `void` | Fires on scrim click or item click |

Place the trigger and `<ds-menu>` inside a `position: relative` container:

```html
<div style="position: relative; display: inline-block">
  <ds-icon-button icon="kebab" (click)="menuOpen.set(!menuOpen())" />
  <ds-menu [open]="menuOpen()" [items]="menuItems" (closed)="menuOpen.set(false)" />
</div>
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

Yes / Skip / No trio from the date-poll voting screen.

| Output | Type | Description |
|---|---|---|
| `yes` | `void` | User tapped the heart button |
| `no` | `void` | User tapped the close button |
| `skip` | `void` | User tapped "Überspringen" |

```html
<ds-vote-buttons (yes)="castVote('yes')" (no)="castVote('no')" (skip)="castVote('skip')" />
```

---

## Related Pages

- [Design System showcase](design-system.md) — live `/ux` preview of all components
- [Spartan → ds-* Migration Guide](spartan-to-ds-migration.md) — mapping from old Hlm* imports
- [Frontend Architecture](../architecture/frontend.md)
