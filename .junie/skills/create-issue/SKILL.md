---
name: create-issue
description: Author or update GitHub issues structured as implementation plans with sub-issue breakdowns. Use when the user asks to create, write, draft, or update an issue or its sub-issues.
---

# Create / Update Issue Skill

Create or update GitHub issues, structured as implementation plans with sub-issues where appropriate.

## Mode Detection

- **Create:** user describes a new task → produce one or more new issues
- **Update:** user references an existing issue number or title → fetch it with `gh issue view <number>` and edit it with `gh issue edit <number>` or add/update sub-issues as needed

For updates, read the current issue body first. Preserve existing content; only add, correct, or restructure what the user asks to change. If sub-issues already exist, link them — do not duplicate them.

---

## Before Creating or Updating Any Issue

### 1. Clarify until everything is clear

Never create or update an issue if any of the following are ambiguous:
- What exactly needs to be implemented or changed
- Which layer(s) are affected (backend, frontend, both)
- Whether this is a new feature, a bug fix, a refactor, or a chore
- Acceptance criteria (how do we know it is done?)

Use `AskUserQuestion` to resolve ambiguity. Do not make assumptions for decisions that belong to the user.

### 2. Flag nonsensical tasks

Before writing any issue body, reason about whether the task makes sense:
- Does it contradict existing architecture or project conventions (check CLAUDE.md)?
- Is there a simpler or already-existing solution?
- Does it duplicate something already tracked?

If something looks off, tell the user explicitly — do not silently create a bad issue.

### 3. Ask for references when implementation is unclear

If you do not know how to implement a specific part (an unfamiliar library, a non-obvious integration pattern, a custom protocol), say so and ask the user for a reference, a doc link, or an example. Do not invent an implementation plan from nothing.

---

## Issue Structure

Write every issue as an **implementation plan**, not just a feature description. The reader should be able to pick up the issue and start working without needing to re-derive the approach.

### Main Issue Body Format

```
## Context
<Why this change is needed — the problem or decision that prompted it.>

## Goal
<One-sentence statement of what done looks like.>

## Approach
<Concise description of the implementation strategy: which files change, 
what pattern to follow, key API or design decisions.>

## Sub-Issues
- [ ] #N  <title>
- [ ] #N  <title>

## Acceptance Criteria
- [ ] <verifiable outcome>
- [ ] <verifiable outcome>
```

### Sub-Issue Body Format

```
## What
<Specific deliverable for this sub-issue only.>

## Implementation
<Step-by-step plan: files to change, APIs to call, patterns to follow.
Include code snippets for non-obvious parts.>

## Verification
<How to confirm this sub-issue is done — test command, Playwright steps, 
manual check, or grep assertion.>
```

---

## When to Split Into Sub-Issues

Split when two or more of the following are true:
- The work spans both backend and frontend
- There are natural sequential dependencies (e.g. API must exist before UI can be built)
- A single piece of work takes longer than a day to implement
- The risk profile differs significantly between parts (e.g. a safe refactor vs. a risky data migration)

Do not split for cosmetic reasons. Three closely related file changes belong in one issue, not three.

### If the scope feels too large

If the total implementation looks like it would take more than 2–3 days or touches more than ~5 unrelated areas, **do not silently pick a split**. Instead:

1. Tell the user the issue feels large and explain why (too many layers, too many unknowns, high risk, etc.)
2. Propose 2–4 concrete split options — each option should name the sub-issues and explain the sequencing
3. Ask the user which split they prefer before creating anything

Example prompt to the user:
> This covers backend schema changes, a new API endpoint, two new frontend components, and a design system update — roughly 3–4 days of work across different risk levels. Here are two ways to split it:
>
> **Option A — Backend first, then UI:**
> 1. `feat(api): add X endpoint` (backend + migration + API tests)
> 2. `feat(ui): build X component` (frontend + e2e + design system)
>
> **Option B — Ship a thin slice first:**
> 1. `feat: X — read-only view` (minimal backend + basic UI, verifiable end-to-end)
> 2. `feat: X — edit & save` (mutations, validation, full e2e)
>
> Which split works better, or do you have a different breakdown in mind?

---

## Automatic Sub-Issue Rules

Apply these rules every time — they are not optional:

### Backend API changed → API test sub-issue

If the issue involves adding, changing, or removing any backend endpoint or business logic, include a sub-issue:

**Title:** `test: add/update API tests for <endpoint or feature>`

**Body must include:**
- Which endpoints are affected (HTTP method + route)
- What scenarios to cover (happy path, validation errors, auth/permission checks)
- Test file location: `api/Finder/` (follow existing test project conventions)

### Frontend changed → Playwright verification sub-issue

If the issue involves any frontend UI change (new component, changed interaction, new page), include a sub-issue:

**Title:** `test(e2e): verify <feature> with Playwright`

**Body must include:**
- Which routes/pages to navigate to
- What interactions to test (clicks, form submissions, state changes)
- Reference the e2e skill: tests live in `e2e/tests/`, use helpers from `helpers.ts`, add `data-testid` to any elements the test targets
- Run with: `npx playwright test` from `e2e/`

### New component or design system change → design system sub-issue

If the issue introduces a new UI component, changes an existing shared component, or alters the visual language, include a sub-issue:

**Title:** `chore(ui): update design-system to showcase <component or change>`

**Body must include:**
- Which component(s) to add or update in `src/app/features/design-system/design-system.component.ts/html`
- What variants or states to demonstrate
- Any new Spartan components to install: `npx nx g @spartan-ng/cli:ui <name>`

### Important architectural decision → wiki sub-issue

If the issue captures a non-obvious architectural decision, introduces a new pattern, replaces a tool, or documents a constraint that future developers need to know, include a sub-issue:

**Title:** `docs: update wiki — <topic>`

**Body must include:**
- Which wiki page(s) to update (check `wiki/votean-wiki/index.md` for existing pages)
- What to write: the decision, the reason, and the trade-off
- Use the `/wiki ingest` skill operation to apply the update

---

## Execution Order

### Creating new issues
1. Resolve all ambiguities with `AskUserQuestion` first
2. Flag any nonsensical aspects
3. If scope feels large, propose split options and ask the user before proceeding
4. Determine the final sub-issue split (including automatic sub-issues from the rules above)
5. Create all sub-issues first (so their numbers are available)
6. Create the main issue last, referencing the sub-issue numbers in the checklist
7. **Register each sub-issue as a proper GitHub sub-issue** (not just a markdown link):
   ```bash
   REPO=$(git remote get-url origin | sed 's/.*github.com[:/]//' | sed 's/\.git$//')
   # For each sub-issue number $SUB, get its internal ID then link it:
   SUB_ID=$(gh api repos/$REPO/issues/$SUB --jq '.id')
   gh api repos/$REPO/issues/$PARENT/sub_issues -X POST -F sub_issue_id=$SUB_ID
   ```
   Do this for every sub-issue after the main issue is created.
8. Report all created issue URLs to the user

### Updating existing issues
1. Fetch the current issue: `gh issue view <number> --json title,body,state`
2. Fetch any existing sub-issues linked in the body
3. Apply the user's changes — add, correct, or restructure; do not delete unrelated content
4. If the update introduces new sub-issues (e.g. a newly discovered backend change triggers an API test sub-issue), create them first, edit the main issue to add them to the checklist, then register them as proper GitHub sub-issues (see step 7 above)
5. Use `gh issue edit <number> --body "..."` to update; use `--body-file` for long bodies
6. Report the updated issue URL

---

## Project Context

- **Repo:** `theneongrey/finder` (use `gh issue create`)
- **Backend:** C# / ASP.NET Core 9 in `api/Finder/` — feature-based structure under `Business/`
- **Frontend:** Angular 21, standalone components, NgRx Signals, Spartan UI + Tailwind CSS 4
- **UI components:** Spartan UI (hlm) — install with `npx nx g @spartan-ng/cli:ui <name>`; see https://www.spartan.ng
- **e2e tests:** Playwright in `e2e/tests/` — always reference the `/e2e` skill
- **Wiki:** `wiki/votean-wiki/` — always reference the `/wiki` skill
- **Design system:** `src/app/features/design-system/design-system.component.ts/html`
- **Label:** use `chore`, `feature`, `bug`, or `test` as appropriate (create label if it does not exist)
