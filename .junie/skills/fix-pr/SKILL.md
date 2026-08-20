---
name: fix-pr
description: Interactive, one-by-one resolution of pull request review findings with explicit user approval before each change. Use when the user asks to fix or address PR review comments.
---

# Fix PR Skill

Review a pull request for quality issues and fix them **one at a time**, with explicit user approval before each change and confirmation that it worked before moving on.

Based on `/review-pr` but interactive: no batching, no auto-applying fixes.

---

## Step 1 — Identify the PR and Show Comments

Accept a PR number (`#123`) or URL, or operate on the current branch's open PR if no argument is given.

```bash
gh pr view <number> --json number,title,body,state,headRefName,baseRefName,additions,deletions,changedFiles
gh pr diff <number>
gh pr view <number> --json files --jq '.files[].path'
```

If the PR is closed or merged, tell the user and stop.

**Before doing anything else: fetch and display all existing review comments and PR comments.**

```bash
# Inline review comments
gh api repos/<owner>/<repo>/pulls/<number>/comments --jq '.[] | "---\n[\(.path):\(.line // "?")]\n\(.user.login): \(.body)"'

# Top-level PR comments
gh pr view <number> --json comments --jq '.comments[] | "---\n" + .user.login + ": " + .body'
```

List every comment to the user — path, line, author, and body — with no analysis or proposed fix yet. Then stop and ask: **"Ready to start fixing? I'll work through them one at a time."**

Wait for the user to confirm before proceeding to Step 2.

---

## Step 2 — Collect All Findings

Run every check from the list below **without acting on anything yet**. Read the full changed files — the diff alone is not enough for structural checks. Use `Glob` and `Grep` to find related files (tests, sibling components, global CSS).

### A — Angular Structure

For every changed `.component.ts`:

- **Separate files** — inline `template:` or `styles:` → should be `.html` / `.css` files (exception: trivial shells)
- **Component size** — TS > 300 lines, HTML > 200 lines, CSS > 300 lines → candidate for splitting; name the natural sub-components
- **Change detection** — missing `ChangeDetectionStrategy.OnPush`
- **State management** — `setInterval`/`setTimeout` not cleared in `ngOnDestroy`; HTTP calls in components; ephemeral UI state that belongs in a store
- **DOM access** — `document.getElementById`/`querySelector` → use `@ViewChild`/`ElementRef`
- **Signal null** — `signal<T | null>` → should be `signal<T | undefined>` (project convention)
- **Template patterns** — `@for` without `track`; old `*ngFor`/`*ngIf` syntax; `[routerLink]` on non-interactive elements
- **i18n** — hardcoded display strings not behind `| translate` (only flag when `TranslatePipe` is used in the same file)
- **Design system** — `ds-*` components that drop their Spartan imports; repeated inline SVGs that could use `<ds-icon>`; hand-rolled button CSS when `<ds-button>` exists

### B — CSS Quality

- **Tailwind preference** — new `.component.css` file added when all its styles could be Tailwind utility classes → flag; migrate to Tailwind unless the styling genuinely cannot be expressed that way (complex animations, unavoidable third-party overrides)
- **Global styles bleed** — classes added to `styles.css` used in only one component → move to that component's CSS (or Tailwind)
- **Unused CSS** — classes defined in `.component.css` that don't appear in the matching `.component.html`
- **Hardcoded values** — hex colours or px values repeated more than once that could be Tailwind classes or CSS custom properties
- **Budget** — `anyComponentStyle` thresholds raised in `angular.json` → flag; right fix is splitting the CSS or migrating to Tailwind, not raising the budget

### C — Dead Code and Orphaned Files

- Removed imports that something else still uses
- Files no longer imported anywhere (grep for the class/component name)
- `@Input()`/`@Output()` properties never bound in any template
- Exported constants/functions defined but never imported
- Untracked files in `git status` referenced from committed code

### D — Tests

- New component with no `.spec.ts`
- Changed business logic (store methods, services) with no corresponding spec update
- Deleted test file that was the only coverage for something still in the codebase
- Redesigned view or new route with no e2e test update (project convention: always update e2e when a view is redesigned)

Do **not** flag missing tests for purely presentational components.

### E — Lint

```bash
cd app/finder && npm run lint 2>&1
```

Only report errors/warnings introduced by this PR, not pre-existing failures.

### F — General Code Quality

- Commented-out code left in the diff
- TODO/FIXME comments added in this PR
- Copy-pasted logic (>5 nearly identical lines appearing more than once)
- Magic numbers with no obvious meaning — should be named constants
- Silent error-swallowing (try/catch with no handler, removed error handler with no replacement)
- Inaccessible interactive elements (`<div (click)="...">`, `<a>` without `href`)
- Routing changes that leave unauthenticated users on bad URLs with nowhere sensible to land

### G — Backend (ASP.NET Core)

For every changed `.cs` file under `api/Finder/`:

- **Domain structure** — new entity, service, or endpoint outside `Business/<Feature>/` → flag; business logic in endpoint handler instead of a service class
- **Response mapping** — AutoMapper imported → flag; missing `ToXxxResponse()` on a new response DTO
- **Migrations** — hand-written migration file → flag (use `dotnet ef migrations add`); `Database.EnsureCreated()` → flag (use `Database.Migrate()`)
- **Async** — `.Result` or `.Wait()` on a `Task` → blocking call; I/O method that is not `async Task<T>`
- **Entity conventions** — new entity not inheriting `BaseEntity`; `Created`/`Edited` set manually
- **DI** — `services.Add*` in `Program.cs` directly instead of a feature `Setup` extension method; `new SomeService()` instead of constructor injection
- **Nullability** — `#nullable disable` or unexplained `!` null-forgiving operators

---

## Step 3 — Triage and Order Findings

Merge the existing reviewer comments (fetched in Step 1) with any new findings from Step 2 into a single list.

1. Discard findings that are:
   - Style preferences with no grounding in CLAUDE.md or project conventions
   - Trivial (single-character typos, trailing whitespace) unless enforced by lint

2. Label each finding:
   - `[must-fix]` — will break the build, CI, or a real user flow
   - `[should-fix]` — clear improvement, low risk
   - `[consider]` — trade-off worth discussing

3. Sort: `[must-fix]` first, then `[should-fix]`, then `[consider]`.

4. Tell the user: "Found N findings. Working through them one at a time, most critical first." Then begin the loop in Step 4.

---

## Step 4 — Present One Finding

For the current finding, write a structured proposal. This is the **only** action taken — do not touch any code yet.

### Proposal format

```
## Issue N of M — [severity] Short title

**File:** `path/to/file.ts` (line X)

**What's wrong:**
One clear paragraph explaining the problem and why it matters. Be specific — name the variable, the method, the CSS class.

**How I'll fix it:**
Step-by-step description of every change to be made:
- `file-a.ts` line X: change Y to Z
- `file-b.html`: replace `<foo>` with `<bar [input]="...">`
- `file-b.css`: remove `.dead-class { ... }`

**What it will look like when done:**
Describe the visible result (UI change, console output, lint output, test output) or the structural result (which imports change, what the component tree looks like). Use a code snippet if it helps visualise the after-state.

**What it will NOT change:**
Call out any behaviour/appearance that stays the same, to reassure the user the fix is contained.

Shall I apply this fix?
```

Then **stop and wait** for the user's response. Do not apply anything yet.

---

## Step 5 — Handle the User's Response

| User says | Action |
|-----------|--------|
| Yes / go ahead / apply it | Proceed to Step 6 |
| No / skip / next | Mark as skipped. Move to the next finding (back to Step 4). |
| Tell me more / why / explain | Give a deeper explanation without applying anything. Repeat the prompt "Shall I apply this fix?" |
| Change the approach / do X instead | Revise the proposal (update Step 4 output) and ask again. |

---

## Step 6 — Apply the Fix

Make **only** the changes described in the approved proposal. Do not clean up unrelated code, do not refactor beyond the scope of the fix, do not add features.

After applying:
1. Run the linter or build if the change could affect them:
   ```bash
   cd app/finder && npm run lint 2>&1 | tail -20
   # or
   cd app/finder && npm run build 2>&1 | tail -20
   ```
2. Report what changed (file paths and a one-line summary per file).
3. Ask: **"Does it work? Let me know and I'll move on to the next issue."**

Then **stop and wait**.

---

## Step 7 — Handle the Verification Response

| User says | Action |
|-----------|--------|
| Yes / works / looks good / confirmed | Mark finding as done. Ask the end-of-issue question (see below). |
| No / broken / something's wrong | Ask the user to describe what's wrong. Diagnose and propose a follow-up fix. Do NOT ask the end-of-issue question until the user confirms it's resolved. |
| Revert it / undo it | Revert the changes made in Step 6 (restore original code). Confirm the revert. Mark as skipped. Ask the end-of-issue question. |

### End-of-issue question

After each finding is resolved (fixed, skipped, or reverted), always ask:

```
What would you like to do?
  [1] Continue to the next issue
  [2] Stop here
  [3] Leave a comment on this fix first
```

Handle each choice:

| Choice | Action |
|--------|--------|
| Continue / 1 | Move to next finding (back to Step 4). If no findings remain, go to Step 8. |
| Stop / 2 | Go directly to Step 8 (print summary of what was handled so far). |
| Comment / 3 | Let the user write freely — they may be flagging a problem, requesting an addition, or adjusting the fix. Treat their input as a follow-up instruction: diagnose, propose if code changes are needed, apply with approval, then ask the end-of-issue question again. |

---

## Step 8 — Finish

When all findings have been processed (done or skipped):

Print a summary table:

```
## Done — PR #<number> fix session

| # | Finding | Result |
|---|---------|--------|
| 1 | [must-fix] Selector lint error in ds-button | ✅ Fixed |
| 2 | [should-fix] setTimeout not cleared | ✅ Fixed |
| 3 | [consider] Inline SVG could use ds-icon | ⏭ Skipped |
```

If any fixes were applied, ask whether the user wants to commit them:
```
All fixes applied. Commit them now?
```

If yes, create a single commit:
```
fix(pr<number>): address review findings

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Escalation

Stop and ask the user if:
- A finding is ambiguous and you can't tell if it's intentional design or an oversight
- Applying a fix would require touching files outside the PR's scope
- The PR is very large (>500 lines changed) and a full review would be impractical — ask if there's a specific area to focus on
- A lint/build step fails in a way you didn't expect and you're not sure why
