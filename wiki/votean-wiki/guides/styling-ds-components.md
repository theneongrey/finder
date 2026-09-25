---
type: Guide
title: Styling ds-* Components
description: Tailwind-first convention for the ds-* design system — when to use utility classes vs. a CSS file, and the ban on static inline style bindings
tags: [frontend, design-system, ds-components, tailwind, css, conventions]
status: stable
generated:
  actor: claude-opus-4-8
  date: 2026-09-25
stale_after: 2027-03-25
sources:
  - title: ds-* Tailwind migration — issue #270
    resource: https://github.com/theneongrey/finder/issues/270
  - title: ds-component library
    resource: app/finder/src/app/common/ui/ds-components/
  - title: ds-button retained CSS (variant + spinner rules)
    resource: app/finder/src/app/common/ui/ds-components/button/ds-button.component.css
---

# Styling ds-* Components

The [ds-* component library](component-library.md) was originally built with per-component
CSS files carrying most of the styling. The convention going forward is **Tailwind-first**:
express styling with Tailwind utility classes in the template, and only keep a
`.component.css` file for the handful of rules Tailwind genuinely cannot express.

This page defines that convention. It was established by the migration in
[issue #270](https://github.com/theneongrey/finder/issues/270) (sub-issues #265–#267),
which moved all 23 ds-* components to Tailwind-first styling.

## 1. Default: Tailwind utility classes in the template

All layout, spacing, colour, typography, and border rules belong on the element as
Tailwind classes:

```html
<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[var(--fs-caption)]">
  ...
</span>
```

- Do **not** add a `.component.css` file or a `styleUrl` in `@Component` unless CSS is
  genuinely required (see §2).
- When migrating a component whose CSS becomes empty, delete the `.css` file **and**
  remove the `styleUrl` line from the `@Component` decorator.
- Colours are always [design tokens](design-system.md#design-tokens) referenced through
  arbitrary-value utilities — `bg-[var(--bg-panel)]`, `text-[var(--text-primary)]`,
  `border-[var(--border-hairline)]`. Never hardcode a hex/rgba; hardcoded colours also
  break dark-surface theming.

## 2. When a CSS file is acceptable

A `.component.css` file is justified **only** for rules Tailwind cannot represent. After
the migration, 13 of the 23 ds-* components keep a CSS file — each for one of these
reasons, documented at the top of the file:

| Pattern | Example component | Why it can't be Tailwind |
|---|---|---|
| `@keyframes` animations | `ds-status-dot` (pulse), `ds-button` (spinner), `ds-poll-card-skeleton` (shimmer) | Tailwind has no keyframe authoring |
| `::before` / `::after` generated content | — | pseudo-element content is not a utility |
| Suppressing a Spartan pseudo-element | `ds-avatar` (`.ds-avatar-circle::after { display:none }`) | overrides a ring Spartan injects via `::after` |
| `::placeholder`, `::selection`, `::-webkit-scrollbar`, `scrollbar-width` | `ds-input` (`::placeholder`), `ds-side-drawer` | pseudo-element / vendor selectors |
| `[data-state]` / `::ng-deep` overrides of Spartan internals | `ds-tabs`, `ds-segmented-control` | must beat Spartan's own utilities at equal specificity + `!important` |
| Complex `@media` positioning | `ds-bottom-sheet` (desktop modal centering with `max()`/`calc()` + `!important`) | container-relative centering that Tailwind can't express |
| CSS custom-property tricks to override Spartan defaults | `ds-button` (`height:auto` so an inline `[style.height]` still wins) | `!important` utility would clobber the runtime inline value |

Keep the retained CSS **minimal** — only the rules that truly cannot move to Tailwind.
Leave a short comment at the top explaining why the file survives (see
[`ds-button.component.css`](../../../app/finder/src/app/common/ui/ds-components/button/ds-button.component.css)
for the pattern).

## 3. No inline `[style.x]` bindings for static values

Do **not** use `[style.prop]="condition ? 'tokenA' : 'tokenB'"` for values known at build
time. Replace them with a conditional class and express the tokens in a modifier rule or
Tailwind:

```html
<!-- Wrong: static values behind an inline style binding -->
<span [style.background]="active ? 'var(--accent)' : 'var(--bg-panel)'"></span>

<!-- Right: conditional class -->
<span [class.chip--active]="active"></span>
```

Inline `[style.x]` bindings are only allowed when the value is a **runtime number** that
cannot be known at build time — e.g. `[style.width.px]="progress()"` on `ds-progress-bar`
or the icon-only `[style.height]` on `ds-button`. In those cases the number comes from an
input/signal and there is no static class that could represent it.

## 4. Global `styles.css` only for cross-component rules

A rule lives in the global `styles.css` **only if it is used by two or more components**.
Everything local to a single component stays in that component's template (Tailwind) or,
if §2 applies, its own `.component.css`. Do not hoist a rule to `styles.css` just to delete
a local file.

## Acceptance checklist (from #270)

When adding or reviewing a ds-* component:

- [ ] No `.component.css` that could be replaced by Tailwind utility classes.
- [ ] Any retained CSS contains only `@keyframes`, `::before`/`::after`, `::ng-deep`,
      `::placeholder`/`::-webkit-scrollbar`, complex `@media` positioning, or Spartan
      override tricks.
- [ ] No `[style.prop]="condition ? 'staticA' : 'staticB'"` bindings — use conditional
      classes instead.
- [ ] Colours reference design tokens, never raw hex/rgba.

## Related

- [Component Library (ds-*)](component-library.md) — API reference for all ds-* components
- [Design System](design-system.md) — tokens and the live `/ux` reference
- [Spartan → ds-* Migration](spartan-to-ds-migration.md) — why ds-* wraps Spartan
- [Frontend Architecture](../architecture/frontend.md) — component layers and UI library
