# Implement Frontend Skill

Rules and reference for implementing Angular frontend files in this project. Follow these conventions exactly — do not deviate unless explicitly told to.

---

## Design Reference Files

When a reference file is provided (typically `claude_design_handoffs/**/*.dc.html`), **treat it as the ground truth for the visual design**. Match it pixel-by-pixel:

- Extract exact colors, spacing, font sizes, border radii, and SVG paths directly from the reference HTML — do not approximate or substitute.
- The reference file contains no real Angular logic, store wiring, or backend calls. Your job is to replicate its visual output while adding the correct Angular bindings, i18n keys, and state connections.
- When the reference renders an SVG inline (e.g. a heart with both `fill` and `stroke` set), reproduce it inline in the Angular template — do not replace it with `<ds-icon>` if `<ds-icon>` cannot express the same visual (see Code Quality Checks for the exception rule).
- Dynamic values in the reference appear as `{{ m.someVar }}` or `style="{{ ... }}"`. Map these to Angular bindings: `[style.background]`, `[attr.fill]`, `(click)`, etc.
- Templated hover styles (`style-hover="..."`) become Tailwind `hover:` classes or Angular host-listener patterns.

---

## File Structure

Angular components use **two** mandatory files. Never use inline `template` or `styles` in the `@Component` decorator:

```
my-component.component.ts   — class + @Component (templateUrl, no styleUrl by default)
my-component.component.html — template
```

A `.component.css` file is added **only** when Tailwind cannot express the styling (complex animations, `:host` selectors with dynamic behaviour, or unavoidable third-party overrides). Never create a CSS file to replicate what Tailwind utility classes already cover.

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

> **Component limitation:** `<ds-component>` cannot <describe the gap>.
> **Options:**
> 1. Extend `<ds-component>` with a new input/output (tell me to do this).
> 2. Use a different existing component — <alternative>.
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
- No inline SVGs that could use `<ds-icon>` — **exception:** when the reference file renders an SVG with a combination that `<ds-icon>` cannot express (e.g. simultaneous `fill` + `stroke` with independent colors), reproduce it inline.
- No custom button CSS when `<ds-button>` already covers the variant.
- **Prefer Tailwind utility classes** in the template over custom CSS. Do not create a `.component.css` file if all styles can be expressed with Tailwind.
- CSS classes added to `styles.css` (global) only when used in more than one component and Tailwind cannot cover the need.
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
