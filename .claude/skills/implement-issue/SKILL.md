# Implement Issue Skill

Implement a GitHub issue or sub-issue end-to-end: plan → branch → code → commits → pull request.

---

## Step 1 — Find the Issue

Accept either an issue number (`#123`) or a title fragment. Fetch full details:

```bash
gh issue view <number> --json number,title,body,state,labels
```

If the issue has sub-issues listed in the body checklist, find the **first unchecked one** and fetch it too:

```bash
gh issue view <sub-number> --json number,title,body,state
```

**Always implement one sub-issue at a time.** If the user points at a parent issue that has open sub-issues, confirm which sub-issue to start with. Do not batch-implement multiple sub-issues in a single session.

If the issue is already closed, tell the user and stop.

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

### When you hit a problem

If implementation runs into an unexpected obstacle (a missing API, a type error that reveals a design conflict, a test that cannot be made to pass):

1. Stop immediately — do not keep trying variations silently
2. Describe the problem clearly to the user: what you tried, what failed, what the blocker is
3. Ask for direction

**Retry limit:** if you attempt the same fix three times without success, stop and notify the user even if you have more ideas. Three failed attempts signals a decision the user needs to make, not more trial and error.

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

## Step 5 — Create the Pull Request

After the final commit, create a PR against `main`:

```bash
gh pr create --base main --title "<issue title>" --body "..."
```

### PR description template

```markdown
## Summary
<1–3 bullets describing what changed and why>

Closes #<issue-number>

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

## Escalation Summary

Stop and notify the user whenever:
- `git pull` results in conflicts or unexpected local state
- A blocker is hit during implementation that requires a design decision
- The same fix has been attempted three times without success
- The issue body lacks enough detail to proceed safely

In every case: describe the situation clearly, state what you need, and wait. Do not take destructive actions (force push, reset, stash) without explicit user approval.
