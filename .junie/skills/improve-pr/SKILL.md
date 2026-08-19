---
name: improve-pr
description: Categorize pull request review feedback (Apply / Argue / Explain) and execute the resulting changes and replies. Use when the user asks to respond to or improve a PR based on review comments.
---

# Improve PR Skill

Read review comments on an open pull request, apply requested changes, argue against ones that don't make sense, and answer explanation requests — all with a plan shown to the user before any code is touched.

---

## Step 1 — Identify the PR

Accept a PR number (`#123`) or URL. Fetch its state and branch:

```bash
gh pr view <number> --json number,title,state,headRefName,baseRefName,body
```

If the PR is closed or merged, tell the user and stop.

---

## Step 2 — Fetch All Comments

Fetch both types in parallel:

**Inline review comments** (line-specific, on changed files):
```bash
gh api repos/{owner}/{repo}/pulls/<number>/comments \
  --jq '.[] | {id: .id, path: .path, line: .line, body: .body, author: .user.login, reply_to: .in_reply_to_id}'
```

**General PR comments** (discussion thread):
```bash
gh pr view <number> --json comments --jq '.comments[] | {id: .id, body: .body, author: .author.login}'
```

**Review-level summaries** (overall review feedback):
```bash
gh pr view <number> --json reviews --jq '.reviews[] | {id: .id, state: .state, body: .body, author: .author.login}'
```

Ignore bot comments and auto-generated messages (e.g. from CI systems).

---

## Step 3 — Categorize Each Comment

Assign each human comment one of three categories:

| Category | Description | Trigger phrases (examples) |
|----------|-------------|---------------------------|
| **Apply** | A concrete code change request that makes sense | "should be", "use X instead", "missing X", "this should", "rename", "extract", "remove" |
| **Argue** | A request that conflicts with conventions, CLAUDE.md, or good design — acknowledge it but push back with a reason | contradicts project patterns, adds unnecessary abstraction, duplicates existing logic, violates `CLAUDE.md` rules |
| **Explain** | The reviewer is asking why something was done, not requesting a change | "why", "what is", "can you explain", "I don't understand", "what does this do" |

**When in doubt, lean toward Apply.** Only argue if you have a clear reason grounded in the project's conventions or architecture.

---

## Step 4 — Build a Response Plan

After categorizing, present a plan to the user **before taking any action**. Format it as a table:

```
## PR #<number> — Review Response Plan

| # | Location | Reviewer | Comment (summary) | Action | Reason |
|---|----------|----------|--------------------|--------|--------|
| 1 | `src/foo.ts:42` | @alice | "Use const instead of let" | **Apply** | Correct — variable is never reassigned |
| 2 | `src/bar.ts:10` | @bob | "Extract this to a helper" | **Argue** | One-line expression; extraction adds indirection without benefit (CLAUDE.md: no premature abstractions) |
| 3 | `src/baz.ts:88` | @alice | "Why is this wrapped in setTimeout?" | **Explain** | Will reply with the reasoning in-thread |

Proceed?
```

Wait for explicit approval before writing any code or posting any comments.

---

## Step 5 — Apply Changes

Check out the PR branch:

```bash
git fetch origin
git checkout <headRefName>
```

Apply all **Apply** changes. Follow `CLAUDE.md` conventions strictly — do not introduce new patterns or clean up unrelated code while implementing a reviewer's request.

**Commit cadence:** group related changes into one commit per logical area (not one commit per comment). Use the format:

```
fix(pr<number>): address review comments

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Push the branch:

```bash
git push
```

---

## Step 6 — Reply to Every Comment

After pushing, reply to every comment that had an action. Do this whether the outcome was Apply, Argue, or Explain.

### Replying to inline review comments

```bash
gh api repos/{owner}/{repo}/pulls/comments/<comment-id>/replies \
  -f body="<reply text>"
```

### Replying to general PR discussion comments

```bash
gh pr comment <number> --body "<reply text>"
```

### Reply templates

**After Apply:**
> Done in <short commit SHA or description>. [Brief description of what changed and why.]

**When Arguing:**
> I'd prefer to keep this as-is — [concrete reason tied to project conventions, CLAUDE.md rule, or architectural principle]. Happy to change it if you feel strongly; just want to flag the trade-off.

**When Explaining:**
> [Clear explanation of the intent, constraint, or reasoning. Reference the relevant code path or issue if helpful.]

Keep replies short. One to three sentences is almost always enough.

---

## Escalation

Stop and ask the user if:
- A comment is ambiguous enough that you can't determine whether it's Apply or Argue
- A requested change would require touching files outside the PR's scope
- Applying a comment would conflict with another comment in the same review
- The reviewer's argument is valid and changes your mind about a previous Argue decision

In those cases, describe the conflict clearly and ask the user how to proceed.
