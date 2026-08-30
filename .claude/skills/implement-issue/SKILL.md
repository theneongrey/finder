# Implement Issue Skill

Implement a GitHub issue or sub-issue end-to-end: plan → branch → code → commits → pull request.

---

## Step 1 — Find the Issue

Accept either an issue number (`#123`) or a title fragment. Fetch full details:

```bash
gh issue view <number> --json number,title,body,state,labels
```

If the issue has sub-issues listed in the body checklist, fetch each one's details:

```bash
gh issue view <sub-number> --json number,title,state
# repeat for each sub-issue in the checklist
```

Then **stop and present the options to the user:**

- List the open sub-issues by number and title.
- If the combined scope looks small (all sub-issues together would fit in one focused PR — e.g. an API field, a model update, and a matching test), say so: _"These three sub-issues are small and tightly related — it would make sense to implement them all in one go. Want me to do that, or pick a specific one?"_
- If the scope looks large or the sub-issues are independent enough to warrant separate PRs, ask: _"Which sub-issue should I start with?"_

**Wait for the user to respond before writing any code or touching git.** Never decide on your own to bundle or split — that call belongs to the user.

Once the user decides, fetch the full details of the chosen sub-issue(s):

```bash
gh issue view <sub-number> --json number,title,body,state
```

If the user points directly at a leaf issue (one with no sub-issues), implement that issue without asking.

If the issue is already closed, tell the user and stop.

### Fetch comments — do this for every issue and sub-issue

After fetching the body, always fetch comments for both the sub-issue and its parent issue. Comments often contain AI implementation plans, corrected instructions, or decisions made after the issue was written:

```bash
gh issue view <sub-number> --json comments --jq '.comments[] | "---\n" + .author.login + ": " + .body'
gh issue view <parent-number> --json comments --jq '.comments[] | "---\n" + .author.login + ": " + .body'
```

**Comments take precedence over the issue body** when they contain corrections, implementation plans, or notes marked for AI implementers. Read them before building your plan.

---

## Step 2 — Build an Implementation Plan

Using the issue body as the primary reference, produce a plan that covers:

1. **Scope** — what exactly will change (files, components, endpoints, tests)
2. **Approach** — the technical strategy; reference the issue's "Implementation" section if present
3. **Commit breakdown** — how the work will be split into commits (each commit should be a coherent, buildable unit)
4. **Unknowns or risks** — anything that may require a decision before or during coding

Present the plan to the user and wait for approval before touching any code or git state.

If the issue is missing critical implementation detail, ask the user to fill the gap rather than guessing.

---

## Step 3 — Prepare the Branch (after plan approval)

Run these steps in order and stop immediately if any fails:

```bash
# 1. Switch to main
git checkout main

# 2. Pull latest
git pull

# 3. Check for conflicts or unexpected state
git status
```

If `git status` shows uncommitted changes, merge conflicts, or anything unexpected: **stop and notify the user**. Do not stash, reset, or overwrite anything without explicit instruction.

If the working tree is clean after the pull, create a feature branch:

```bash
git checkout -b <branch-name>
```

**Branch naming:** derive from the issue number and a short slug of the title:
- `feature/123-add-user-avatar` for features
- `fix/123-broken-date-picker` for bug fixes
- `chore/123-remove-primeng` for maintenance

---

## Step 4 — Implement

Follow the plan. Adhere to all conventions in `CLAUDE.md` and the project's existing patterns.

### Conventions

#### Frontend (Angular)
Follow all rules in the `/implement-frontend` skill:
- **Tailwind utility classes over custom CSS** — prefer inline Tailwind classes in templates; only add a `.component.css` file when Tailwind cannot express the styling (complex animations, unavoidable third-party overrides).
- Two-file component default (`.ts` + `.html`); no `styleUrl` unless a CSS file is genuinely required.
- ds-* design system layer, OnPush change detection, `signal<T | undefined>`, Angular 17+ control flow (`@if`/`@for`).
- **Run prettier before every frontend commit:**

```bash
cd app/finder && npx prettier --write "src/**/*.{ts,html,css}"
```

#### Backend (ASP.NET Core)
- **No business logic in endpoint handlers** — delegate to a service class in `Services/`.
- **Feature-based layout** — new domain entities, services, and endpoints belong in `api/Finder/Business/<Feature>/` following the established folder structure.
- **Response mapping** — add a static `ToXxxResponse()` extension method in the `Responses/` file; never use AutoMapper.
- **Migrations** — always generate with `dotnet ef migrations add <Name>`; never write migration files by hand.
- **Async all the way** — every I/O method must be `async`/`await`; never call `.Result` or `.Wait()`.
- **BaseEntity** — new entities should inherit `BaseEntity` so `Created`/`Edited` are set automatically by `AppDbContext`.
- **DI registration** — register new services in the feature's `Setup/<Feature>Setup.cs` extension method; do not scatter `services.Add*` calls in `Program.cs`.
- **No magic strings** — bind configuration via strongly-typed options classes (`IOptions<T>`).

### When you hit a problem

#### Complete blockers (no solution known)

If implementation hits an obstacle with no clear path forward:

1. Stop immediately — do not keep trying variations silently
2. Describe the problem clearly: what you tried, what failed, what the blocker is
3. Ask for direction

**Retry limit:** if you attempt the same fix three times without success, stop and notify the user even if you have more ideas.

#### Non-obvious decisions (solution known, but non-trivial trade-off)

If you find a problem AND already know a fix, but the fix involves an unexpected constraint or trade-off — stop and present it for approval before applying it. Do not silently implement clever workarounds, even if you are confident they work.

A decision is non-obvious when it involves any of the following:
- A version or API incompatibility (e.g., library A requires framework version N+1)
- A third-party preset or plugin that is incompatible with a project-level config (e.g., Tailwind prefix mode conflict with a library's CSS)
- Modifying a shared infrastructure file beyond what the plan described (`styles.css`, `tsconfig.json`, `package.json`, etc.)
- Choosing between two approaches because one doesn't work for a constraint the issue didn't anticipate
- Deviating from a pattern described in `CLAUDE.md` or the issue body

**Format for presenting the decision:**

> **Decision needed:** [One sentence naming the conflict]
>
> **Problem:** [What you found — the incompatibility or constraint]
>
> **Proposed solution:** [What you would do — the specific change, why it works, and what it gives up]
>
> **Alternative:** [At least one other option, even if you think it's worse]
>
> OK to proceed with the proposed solution?

Wait for explicit approval before writing any code related to the decision.

### Commit cadence

Commit after each coherent unit of work — not after every file, not at the very end. Good commit boundaries:

- Backend model + migration (before adding endpoint)
- Endpoint + request/response DTOs
- Frontend service + store method
- UI component(s) for a single feature area
- Test additions (API tests or e2e tests)
- Design system update
- Wiki update

Each commit must leave the codebase in a buildable state. Never commit half-finished code.

**Commit message format** (follow the repo's existing style from `git log`):

```
<type>(<scope>): <short summary>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Step 5 — Push and Create the Pull Request

After the final commit, push the branch then create a PR against `main`:

```bash
git push -u origin <branch-name>
gh pr create --base main --title "<issue title>" --body "..."
```

### PR description template

```markdown
## Summary
<1–3 bullets describing what changed and why>

Closes #<sub-issue-number>
<!-- Close each sub-issue this PR implements. If the user approved bundling multiple sub-issues, list all of them. Do not close sub-issues that were not implemented. -->

## Implementation Notes
<Explain any non-obvious decisions made during implementation:
- Why a particular pattern was chosen over alternatives
- Any trade-offs or known limitations
- Anything a reviewer needs to know to understand the diff>

## How to Test
<Step-by-step manual verification or reference to automated tests:
- Which routes/features to exercise
- What to look for>

## Checklist
- [ ] Builds without errors
- [ ] Relevant tests pass
- [ ] No PrimeNG imports introduced (frontend changes)
- [ ] Design system updated (if new component added)
- [ ] Wiki updated (if architectural decision made)
```

### Inline PR comments

After creating the PR, add inline review comments (`gh api`) on any code that needs explanation at the line level — non-obvious logic, a workaround for a specific constraint, a subtle invariant. Do not comment on self-explanatory code.

---

## Step 6 — Automated PR Review

After the PR is created, immediately dispatch the `pr-reviewer` subagent to review your changes:

```
Agent({
  subagent_type: "pr-reviewer",
  description: "Review PR #<number>",
  prompt: "<PR number or URL>"
})
```

Wait for the review to finish. Once the subagent returns its findings:

- If there are **blocking issues** (correctness bugs, broken builds, security problems): fix them on the branch, push, and re-run the review.
- If there are **non-blocking suggestions**: present them to the user and ask whether to address them.
- If the review is **clean**: report that to the user and consider the task complete.

Do not close the issue or mark the task done until the first clean review pass (or the user explicitly accepts the outstanding findings).

---

## Escalation Summary

Stop and notify the user whenever:
- `git pull` results in conflicts or unexpected local state
- A complete blocker is hit with no clear path forward
- The same fix has been attempted three times without success
- The issue body lacks enough detail to proceed safely
- A non-obvious technical decision arises — even when a fix is known (see "Non-obvious decisions" above)

In every case: describe the situation clearly, state what you need, and wait. Do not take destructive actions (force push, reset, stash) without explicit user approval.
