# Merge PR Skill

Merge a pull request safely and, once it is merged, check whether anything in it belongs in
the wiki — then offer to ingest it.

Two rules this skill enforces on every run:

1. **We only ever merge into `main`.** No PR is merged into any other branch.
2. **Every merge is followed by a wiki relevance check.** After a PR merges, inspect what
   changed for knowledge worth capturing and ask the user before writing anything.

---

## Step 1 — Identify the PR

Accept a PR number (`#123`) or URL, or operate on the current branch's open PR if no argument
is given.

```bash
gh pr view <number> --json number,title,body,state,baseRefName,headRefName,mergeable,mergeStateStatus
```

If the PR is already merged, skip to **Step 4** (wiki check) — the knowledge is still worth
capturing even if the merge already happened.

If the PR is closed (not merged), tell the user and stop.

---

## Step 2 — Verify the base branch is `main`

**This is a hard gate.** Read `baseRefName` from Step 1.

- If `baseRefName == "main"` → continue.
- If it is anything else → **stop and notify the user.** Do not merge. Do not retarget the PR
  on your own. Explain that this project merges only into `main` and ask whether the base
  should be changed:

  ```bash
  # only after explicit user approval:
  gh pr edit <number> --base main
  ```

Never merge a PR whose base is not `main`.

---

## Step 3 — Merge

Confirm the PR is mergeable (`mergeable`, `mergeStateStatus`). If it is blocked (conflicts,
failing required checks, pending review), report the specific blocker and stop — do not try to
force it.

Merging is an outward-facing, hard-to-reverse action. Confirm with the user which merge
method to use unless they have already told you, then run it:

```bash
gh pr merge <number> --squash   # or --merge / --rebase, per the user's choice
```

Do not pass `--admin` or otherwise bypass branch protection unless the user explicitly asks.

Report the result (merged commit SHA, whether the head branch was deleted).

---

## Step 4 — Wiki relevance check (always)

After the merge, determine whether the PR contains anything the [wiki](../wiki/SKILL.md)
should record. Pull the PR's title, body, and file list:

```bash
gh pr view <number> --json title,body,files --jq '.title, .body, (.files[].path)'
```

Treat the PR as **wiki-relevant** if it does any of:

- introduces or removes a feature, route, or user-facing flow;
- changes architecture — routing, stores, service boundaries, entities, migrations;
- establishes or changes a convention (styling, testing, naming, DI, security);
- adds or removes a domain concept, endpoint, or contract;
- makes a non-obvious decision or trade-off a future contributor would need explained.

Treat it as **not wiki-relevant** (no action needed) if it is purely: a dependency bump, a
formatting/lint pass, a small bug fix with no behavioural or architectural change, or a test-
only change that documents nothing new.

### Present the finding and ask

Do **not** edit the wiki unprompted. Summarise what you found and ask:

> **Wiki check for #<number> — <title>**
>
> This PR looks wiki-relevant because: <one or two specific reasons>.
>
> Suggested wiki updates:
> - <page path> — <what would change>
> - <page path> — <what would change>
>
> Want me to ingest this into the wiki? (yes / no / edit the plan)

If the PR is not wiki-relevant, say so in one line and stop — don't ask a pointless question.

### On approval

Invoke the `/wiki ingest <PR #>` skill to apply the updates: create/refine the affected
pages, update `index.md` if pages were added, and append a `log.md` entry. Follow the wiki's
OKF page format and relative-link rules.

---

## Escalation Summary

Stop and notify the user whenever:

- the PR's base branch is not `main` (never merge it);
- the PR is not mergeable (conflicts, failing checks, pending review);
- the merge method or branch-protection bypass is unclear — ask, don't assume.

Never take destructive or irreversible actions (force merge, `--admin` bypass, base retarget,
branch deletion) without explicit user approval.
