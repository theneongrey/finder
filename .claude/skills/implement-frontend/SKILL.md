# Implement Frontend Skill

Rules and reference for implementing Angular frontend files in this project. Follow these conventions exactly — do not deviate unless explicitly told to.

---

## File Structure

Every Angular component **must** use three separate files. Never use inline `template` or `styles` in the `@Component` decorator:

```
my-component.component.ts   — class + @Component (templateUrl + styleUrl)
my-component.component.html — template
my-component.component.css  — styles
```

All components must use `changeDetection: ChangeDetectionStrategy.OnPush`.

---

## State Management

- Never call the backend directly from a component — always go through a store or service.
- Store methods use `rxMethod` + `switchMap` + `tapResponse`. All async side effects live in stores, not components.
- Prefer `signal<Foo | undefined>` over `signal<Foo | null>` for unset values.
- Never use `setInterval` / `setTimeout` without cleaning up in `ngOnDestroy`.

---

## Template Patterns

- Always use Angular 17+ control flow: `@if`, `@for`, `@switch` — never `*ngIf` / `*ngFor`.
- `@for` always requires a `track` expression.
- Never use `document.getElementById` or `document.querySelector` — use `@ViewChild` or `ElementRef`.
- When the project uses `TranslatePipe` (`| translate`), never hardcode display strings in templates.

---

## PrimeNG

When a PrimeNG component is needed, use `app/finder/primngllms.txt` as reference.

---

## Component Layers — Use Existing Components First

The project has three component layers. **Always check these before writing new markup.**

### Layer 1 — ds-* Design System (`@ds/*`)

Directory: `app/finder/src/app/common/ui/ds-components/`  
Selector prefix: `ds-*`

Pure presentational primitives. No domain knowledge, no store injection. Use these for all generic UI needs.

**If a ds-* component almost does what you need but can't quite display or behave the right way:**  
Stop — do not hack around it. Inform the user with:

> **Component limitation:** `<ds-component>` cannot \<describe the gap\>.
> **Options:**
> 1. Extend `<ds-component>` with a new input/output (tell me to do this).
> 2. Use a different existing component — \<alternative\>.
> 3. Write a new ds-* component for this pattern.

Wait for direction before proceeding.

#### Available ds-* Components

| Component | Selector | Key inputs/outputs |
|---|---|---|
| Icon | `<ds-icon>` | `name` (see catalogue), `size` (px), `color` |
| Button | `<ds-button>` | `variant` (primary/dark/outline/subtle/ghost), `icon`, `fullWidth`, `loading`, `disabled` |
| Icon button | `<ds-icon-button>` | `icon`, `variant` (surface/ghost/dark), `size`, `title` |
| Avatar | `<ds-avatar>` | `initial`, `bg`, `fg`, `size` (sm/md/lg/px), `ring` |
| Avatar stack | `<ds-avatar-stack>` | `avatars: AvatarItem[]`, `max`, `size`, `showAdd`; output: `addClicked` |
| Badge | `<ds-badge>` | `tone` (accent/neutral/warning/viewer/contributor/manager/success), `icon` |
| Status dot | `<ds-status-dot>` | `tone` (positive/muted) |
| Card | `<ds-card>` | `padding` (px), `accentBorder` |
| Input | `<ds-input>` | `type` (text/date/time), `label`, `error`, `placeholder`, `background`; ControlValueAccessor |
| Progress bar | `<ds-progress-bar>` | `percent` (0–100), `height` (px) |
| Segmented control | `<ds-segmented-control>` | `options: SegmentOption[]`, `[(value)]` two-way, `size` (sm/md) |
| Tabs | `<ds-tabs>` | `items: TabItem[]`, `[(value)]` two-way, `size` (sm/md) |
| Bottom sheet | `<ds-bottom-sheet>` | `title`, `subtitle`; output: `close` |
| Menu | `<ds-menu>` | `open`, `items: MenuItem[]`; output: `closed` |
| Empty state button | `<ds-empty-state-button>` | `layout` (row/tile), `icon`, `label`; output: `clicked` |
| Vote buttons | `<ds-vote-buttons>` | outputs: `yes`, `no`, `skip` |

**Icon catalogue (23 names):** `logo` `chevron-left` `chevron-right` `arrow-right` `kebab` `comment` `share` `edit` `trash` `lock` `users` `calendar` `clock` `refresh` `play` `send` `trophy` `close` `check` `heart` `grid` `folder` `checklist` `plus`

**ds-* wraps Spartan UI** for interaction (overlay, focus management). Never strip Spartan imports from ds-* component files.

### Layer 2 — Common Smart Components (`@smart/*`)

Directory: `app/finder/src/app/common/ui/smart-components/`  
Selector prefix: `app-*`

Know about cross-cutting domain models (`User`) and inject global stores (`UserStore`, `TitleBarService`). Used across multiple feature domains.

Key examples: `app-user-avatar` (accepts `User`, derives palette internally), `app-title-bar`.

### Layer 3 — Domain Feature Components

Directory: `app/finder/src/app/features/<domain>/`  
Selector prefix: `app-*`

Feature-specific components. Import domain models and enums, may inject feature stores.

- Place in `_shared/ui/` when used by **two or more sub-features** of the same domain.
- Co-locate with the sub-feature when used in **exactly one** sub-feature.

### Decision Tree

```
Does it import a domain type (OptionType, PollItem, User, …)?
├── No  → ds-* component in common/ui/ds-components/
└── Yes → Is it used across multiple unrelated feature domains?
          ├── Yes → common smart component in common/ui/smart-components/
          └── No  → domain feature component
                    ├── Used in ≥ 2 sub-features? → features/<domain>/_shared/ui/
                    └── Used in 1 sub-feature?   → co-locate in that sub-feature
```

---

## Code Quality Checks (run before reporting done)

- No PrimeNG imports introduced (project has migrated away from it).
- No inline SVGs that could use `<ds-icon>`.
- No custom button CSS when `<ds-button>` already covers the variant.
- CSS classes added to `styles.css` (global) only when used in more than one component — otherwise put in the component's `.component.css`.
- No `signal<Foo | null>` — use `| undefined`.
- `@for` blocks all have `track`.
- No `*ngIf` / `*ngFor` (use `@if` / `@for`).

---

## Escalation

Stop and inform the user when:

- A ds-* component cannot display or behave as required (see "Component limitation" format above).
- A Spartan UI component would need to be stripped of its imports to work — never do this silently.
- A shared infrastructure file (`styles.css`, `tsconfig.json`, `angular.json`) needs a change beyond what was planned.
- The same implementation attempt has failed three times.
