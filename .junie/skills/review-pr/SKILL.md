---
name: review-pr
description: Automated structural review of a pull request across Angular, CSS, backend domains, and tests, posting comment-only feedback. Use when the user asks to review a PR.
---

# Review PR Skill

Review a pull request for quality issues, structural problems, and future risks. Post inline comments for specific code locations and general comments for broader concerns. Never approve or request changes — always use `COMMENT` event so the author decides what to act on.

---

## Step 1 — Identify the PR

Accept a PR number (`#123`) or URL.

```bash
gh pr view <number> --json number,title,body,state,headRefName,baseRefName,additions,deletions,changedFiles
gh pr diff <number>
gh pr view <number> --json files --jq '.files[].path'
```

If the PR is closed or merged, tell the user and ask if they still want to review it.

---

## Step 2 — Run Checks

Run all checks below. Read the actual changed files — the diff alone is not enough for structural checks that depend on the full file. Use `Glob` to find related files (tests, global CSS, sibling components).

### A — Angular Structure

For every changed `.component.ts` file:

**Separate files**
- Inline `template:` in `@Component` → should be a `.component.html` file
- Inline `styles:` / `styleUrls: [string]` → should be a `.component.css` file
- Exception: trivial shells (`template: ''`) are fine inline

**Component size**
- TypeScript > 300 lines → candidate for splitting
- HTML template > 200 lines → candidate for splitting
- CSS > 300 lines → candidate for splitting or extraction of section-specific files
- When a component is large, identify the natural sub-components (self-contained state + template blocks) and suggest specific names

**Change detection**
- Missing `changeDetection: ChangeDetectionStrategy.OnPush` → flag it; all components in this project should use OnPush

**State management**
- Signals, computed values, or async side effects in a component that belong in a store or service
  - `setInterval` / `setTimeout` that aren't cleaned up in `ngOnDestroy`
  - HTTP calls directly in a component (should go through a store/service)
  - `emailSent`-style ephemeral state that survives navigation and belongs in the user store
- Rule: "All async side effects live in stores, not components" (CLAUDE.md)

**DOM access**
- `document.getElementById(...)` or `document.querySelector(...)` → use `@ViewChild` or `ElementRef`; direct DOM access is SSR-incompatible and untestable

**Signal null/undefined**
- `signal<Foo | null>` → should be `signal<Foo | undefined>` (project convention: prefer `undefined` over `null` for unset signal values)

**Angular template patterns**
- `@for` without `track` expression → always required; flag missing ones
- `*ngFor` / `*ngIf` (old directive syntax) → should be `@for` / `@if` (Angular 17+ control flow)
- `[routerLink]` on a non-anchor, non-button element → check if it works as intended
- Inline `[style.x]="hardcoded-value"` for things that could be CSS classes

**i18n**
- Hardcoded display strings in templates (German or otherwise) that are not behind `| translate` → flag only if the project uses ngx-translate (check for `TranslatePipe` usage in the same file)

**Design system**
- `ds-*` components that import from `@spartan-ng/helm/*` → make sure the Spartan import is still present (ds-* wraps Spartan, never strips it)
- Inline SVGs repeated in multiple places that could use `<ds-icon>`
- Custom button CSS classes when `<ds-button>` already exists

### B — CSS Quality

**Tailwind preference**
- New `.component.css` file added when all its styles could be expressed as Tailwind utility classes in the template → flag; only create a CSS file when Tailwind genuinely cannot cover the need (complex animations, unavoidable third-party overrides)
- CSS file retained with rules that are direct equivalents of Tailwind utilities (e.g. `display: flex` instead of `flex`, `color: #...` instead of a Tailwind colour class) → suggest migration to Tailwind

**Global styles bleed**
- Open `app/finder/src/styles.css` (or `global_styles.css`). For each class added there, check if it is used in more than one component. If it's only used in one component, and Tailwind can't cover it, flag it as a candidate to move to that component's `.component.css`.

**Unused CSS**
- CSS classes defined in a `.component.css` that don't appear in the matching `.component.html` → dead styles
- CSS classes in the diff that override or duplicate classes already defined elsewhere in the same file

**Hardcoded colours / magic numbers**
- Hex colours or pixel values that appear more than once in the same file and could be CSS custom properties or Tailwind classes
- Colours that look like they should come from design tokens (`var(--accent)`, `var(--text-primary)`, etc.) but are hardcoded

**Budget**
- If `angular.json` `anyComponentStyle` warning/error thresholds are raised, flag this as an altitude problem — the right fix is splitting the CSS or migrating to Tailwind, not raising the budget

### C — Dead Code and Orphaned Files

- Imports removed from one file that were providing something another file still uses
- Files that are no longer imported anywhere (grep for the class/component name)
- `@Input()` / `@Output()` properties on a component that are never bound in any template (grep for `<selector` usages)
- Exported constants or functions that are defined but never imported
- Check for `??` untracked files in `git status` that are referenced from committed code — this will break CI

### D — Tests

Check whether tests exist or were updated for changed code:

```bash
# Find spec files near changed components
# e.g. if home.component.ts changed, look for home.component.spec.ts
```

Flag:
- New component with no `.spec.ts`
- Changed business logic (store methods, services) with no corresponding spec update
- Deleted test file that was the only coverage for something still in the codebase
- E2E tests (`e2e/tests/*.spec.ts`): if a view was redesigned or a new route was added, e2e tests should reflect it (project convention: "Always update e2e tests when a view is redesigned")

Do **not** flag missing tests for purely presentational components (no logic, no signals).

### E — Lint

Run the linter on the changed files:

```bash
cd app/finder && npm run lint 2>&1
```

Report any errors or warnings introduced by the PR. If lint was already failing before the PR, note that but don't attribute pre-existing failures to this PR.

If lint fails to run (dependencies not installed, etc.), note that and skip this check.

### F — General Code Quality

- **Commented-out code** left in the diff → remove it
- **TODO / FIXME** comments added in this PR → flag for resolution or tracking in an issue
- **Copy-paste** — the same logic block (>5 lines, nearly identical) appearing more than once in the diff → suggest extraction
- **Magic numbers** — numeric literals with no obvious meaning; should be named constants
- **Error paths dropped** — a try/catch that swallows errors silently, or a removed error handler with no replacement
- **Accessibility** — interactive elements (`<div (click)="...">`, `<a>` without `href`) that are not keyboard-reachable or not announced by screen readers
- **Wildcard route / navigation** — if routing changed, check that unauthenticated users on bad URLs still land somewhere sensible (not an auth wall when a public home page now exists)

### G — Backend (ASP.NET Core)

For every changed `.cs` file under `api/Finder/`:

**Domain structure**
- New entity, service, or endpoint placed outside `Business/<Feature>/` → flag; all feature code belongs in the feature folder
- Business logic (queries, mutations, validation) placed directly in an endpoint handler instead of a service class

**Response mapping**
- AutoMapper imported or used → flag; project uses static `ToXxxResponse()` extension methods
- New response DTO with no `ToXxxResponse()` method → missing mapper

**Migrations**
- Hand-written migration file (not generated by `dotnet ef migrations add`) → flag; always use EF tooling
- `Database.EnsureCreated()` called anywhere → flag; project uses `Database.Migrate()` for auto-apply

**Async**
- `.Result` or `.Wait()` called on a `Task` → blocking call; use `await` instead
- I/O method (EF query, HttpClient call) that is not `async Task<T>` → flag

**Entity conventions**
- New entity not inheriting `BaseEntity` → missing auto-tracked `Created`/`Edited`
- `Created` or `Edited` set manually instead of relying on `AppDbContext.SaveChangesAsync`

**DI**
- `services.Add*` calls added directly in `Program.cs` instead of a feature `Setup/<FeatureSetup.cs` extension method
- `new SomeService()` used instead of constructor injection → bypasses DI

**Nullability**
- `#nullable disable` or `!` null-forgiving operators added without explanation → flag

---

## Step 3 — Triage Findings

After running all checks, triage findings into two buckets:

| Bucket | Criteria | Comment destination |
|--------|----------|---------------------|
| **Inline** | Issue is tied to a specific file and line | Inline review comment on that line |
| **General** | Issue is structural, cross-file, or concerns the overall approach | Top-level PR comment |

Discard findings that are:
- Already flagged by a previous reviewer in an open comment
- Style preferences with no grounding in CLAUDE.md or project conventions
- Trivial (single-character typos, trailing whitespace) unless the project enforces them via lint

**Severity labels to use in comments:**
- `[must-fix]` — will break the build, CI, or a real user flow
- `[should-fix]` — clear improvement, low risk to change now
- `[consider]` — trade-off worth discussing; no strong stance

If there are no findings after triage, post a brief general PR comment saying the PR looks clean (mention which checks ran) and stop.

---

## Step 4 — Post Comments

Get the repo slug first:

```bash
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
```

### Inline comments (file + line specific)

Post as a single batched PR review so all inline comments appear together:

```bash
gh api repos/$REPO/pulls/<number>/reviews \
  -X POST \
  --field event="COMMENT" \
  --field body="<overall-summary-if-any>" \
  --field "comments[][path]=<file-path>" \
  --field "comments[][line]=<line-number>" \
  --field "comments[][side]=RIGHT" \
  --field "comments[][body]=<comment-text>" \
  ... (repeat --field pairs for each inline comment)
```

If the API call exceeds shell limits (many comments), split into multiple review calls.

For **deleted lines** (side = LEFT):
```bash
  --field "comments[][side]=LEFT"
```

### General PR comments

```bash
gh pr comment <number> --body "<comment text>"
```

Use one general comment for all non-inline findings rather than spamming multiple top-level comments.

### Comment format

**Inline comment template:**
```
[severity] Short title

Problem: what is wrong and why it matters.

Suggestion:
```ts
// concrete fix or alternative
```
```

**General comment template:**
```markdown
## PR Review — <title>

<1–2 sentence overall impression>

### [must-fix] Finding title
<location if any> — <problem and suggestion>

### [should-fix] Finding title
...

### [consider] Finding title
...
```

Keep comments short — one problem, one suggestion. Don't restate what the code does.

---

## Escalation

Stop and ask the user if:
- A finding is ambiguous and you can't tell if it's intentional design or an oversight
- Running lint requires installing dependencies and you're not sure if that's safe in this environment
- The PR is very large (>500 lines changed) and a full review would be impractical — ask if there's a specific area to focus on
