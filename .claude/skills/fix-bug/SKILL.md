# Fix Bug Skill

Diagnose a bug, fix it on a dedicated branch, open a PR, and report the review findings — without auto-applying any new issues found by the reviewer.

---

## Step 1 — Switch to main and pull

```bash
git checkout main
git pull origin main
```

If the checkout fails (uncommitted changes on the current branch), stop and tell the user. Do not stash or discard anything without explicit approval.

---

## Step 2 — Create a fix branch

Derive a short, lowercase, hyphen-separated slug from the bug description (max 5 words). Branch off main:

```bash
git checkout -b fix/<short-bug-description>
```

---

## Step 3 — Diagnose the bug

Before touching any code:

1. Read the relevant files. Use `Glob` and `Grep` to locate code related to the bug report.
2. Form a diagnosis. Choose one of three postures based on confidence:

   **Confident** — you can see the exact cause:
   > "The bug is X. Here's why: [concise explanation]. I'll fix it by [approach]."

   **Suspicious** — you have leads but not certainty:
   > "I'm not certain, but the most likely cause is X because [reason]. Other possibilities: Y (less likely because ...), Z (unlikely but possible if ...). My plan is to investigate X first."

   **Unsure** — not enough information to act:
   > "I can't identify the root cause from the available code. To proceed I'd need: [what's missing — logs, reproduction steps, a specific file, etc.]."

3. **Stop and present the diagnosis to the user.** Do not write any code yet.

Wait for the user to respond before proceeding. If the user says:

| Response | Action |
|----------|--------|
| "Fix it" / "Go ahead" / confirms the diagnosis | Proceed to Step 4 |
| Provides more context / corrects the diagnosis | Revise diagnosis and present again |
| "Stop" / "Don't fix" | Abort; stay on the fix branch |

---

## Step 4 — Fix the bug

Make the minimal change that resolves the root cause. Do not:
- Refactor unrelated code
- Add features beyond the scope of the fix
- Add error handling for scenarios that can't happen

After making changes, verify the fix compiles and lints cleanly:

**Frontend:**
```bash
cd app/finder && npm run lint 2>&1 | tail -30
cd app/finder && npm run build 2>&1 | tail -30
```

**Backend:**
```bash
cd api/Finder && dotnet build 2>&1 | tail -30
```

Run only the relevant check(s) for the files you changed. If a check fails, fix the issue before committing.

---

## Step 5 — Commit, push, open PR

Stage only the files changed by the fix. Create a single commit:

```bash
git add <changed files>
git commit -m "$(cat <<'EOF'
fix(<scope>): <short description of what was fixed>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
git push -u origin fix/<short-bug-description>
```

Then open a PR against `main`:

```bash
gh pr create --title "fix: <short description>" --body "$(cat <<'EOF'
## Summary

- <what the bug was>
- <what caused it>
- <what the fix does>

## Test plan

- [ ] Reproduce the original bug before the fix
- [ ] Confirm the bug no longer occurs after the fix
- [ ] Check adjacent functionality is unaffected

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Note the PR number from the output.

---

## Step 6 — Review the fix (subagent)

Spawn the `pr-reviewer` agent with the PR number as its prompt:

```
Agent({ subagent_type: "pr-reviewer", prompt: "Review PR #<number>" })
```

The agent runs all checks, posts inline and general comments to GitHub, and returns a structured findings summary. Wait for it to complete before proceeding.

---

## Step 7 — Report to the user

Present a two-part summary. Do **not** fix any issues found by the reviewer yet — list them and let the user decide.

```
## Bug fix complete — fix/<short-bug-description>

### What was fixed
<1–3 bullet points describing the root cause and the change made>

PR: <URL>

### Review findings
<Copy the reviewer's findings here, grouped by severity: [must-fix], [should-fix], [consider]>

No findings were auto-applied. Use /fix-pr to address them interactively, or tell me which ones to fix.
```

If the reviewer found nothing, say so:
```
### Review findings
The reviewer found no issues. The fix looks clean.
```
