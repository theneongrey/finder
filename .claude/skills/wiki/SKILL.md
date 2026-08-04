# Wiki Skill

You maintain the Votean project wiki at `wiki/votean-wiki/`. The wiki is an LLM-maintained knowledge base modeled after the Karpathy LLM-Wiki pattern and stored in Open Knowledge Format (OKF).

## Three Operations

### ingest `<source>`

Process a source (file path, topic, or conversation context) and update the wiki.

1. Read the source material.
2. Identify which wiki pages are affected (5–15 pages per ingest).
3. For new concepts: create a page with OKF frontmatter (see Page Format below).
4. For existing pages: append or revise the markdown body — never delete history, only refine.
5. Update `index.md` if new pages were added.
6. Append one entry to `log.md`:
   ```
   ## YYYY-MM-DD — ingest: <source-label>
   Pages touched: <comma-separated list>
   ```

### query `<question>`

Answer a question using the wiki as the primary source.

1. Identify the relevant wiki pages from `index.md`.
2. Read those pages.
3. Synthesize an answer with inline citations `[page-title](relative/path.md)`.
4. If the answer reveals a gap, note it in `log.md` and optionally create a stub page.
5. If the answer is novel enough to be reusable, offer to write it as a new wiki page.

### lint

Audit the wiki for health issues and fix them.

Checks to run:
- **Broken links** — every `[text](path.md)` target must exist in the bundle.
- **Orphan pages** — every `.md` file (except `index.md`, `log.md`, `SCHEMA.md`) must appear in at least one `index.md`.
- **Missing frontmatter** — every non-reserved page must have parseable YAML between `---` delimiters with a non-empty `type` field.
- **Stale pages** — pages whose `stale_after` date is in the past need a review note.
- **Contradictions** — flag claims that directly conflict across pages; do not auto-resolve, ask the user.

Report findings as a checklist. Fix structural issues (links, orphans, frontmatter) automatically. Flag semantic issues (contradictions, staleness) for human review.

## Page Format (OKF)

Every non-reserved page must begin with YAML frontmatter:

```yaml
---
type: <Concept | Feature | Architecture | API | Guide>
title: <Human-readable name>
description: <One-line summary>
tags: [<tag>, ...]
status: draft          # draft | stable | deprecated
generated:
  actor: claude-sonnet-4-6
  date: YYYY-MM-DD
stale_after: YYYY-MM-DD   # optional; set ~6 months out for fast-moving areas
sources:
  - title: <source label>
    resource: <file path or URL>
---
```

After the frontmatter: free-form markdown.

### Cross-Linking Rule

**Always use standard relative markdown links — never Obsidian-style `[[WikiLink]]` syntax.** Obsidian links do not render in GitHub or standard markdown viewers and break navigation.

Use relative paths from the current file's directory:

```markdown
# Same directory (e.g. concepts/ → concepts/)
[Option](option.md)

# Cross-directory (e.g. concepts/ → features/)
[Polling](../features/polling.md)

# Cross-directory (e.g. features/ → architecture/)
[Backend](../architecture/backend.md)

# Piped labels — use [display text](path.md) syntax
[polls](../concepts/poll.md)
```

Directory reference table for computing relative paths:

| From \ To | concepts/ | features/ | architecture/ | guides/ | api/ |
|-----------|-----------|-----------|---------------|---------|------|
| concepts/ | `file.md` | `../features/file.md` | `../architecture/file.md` | `../guides/file.md` | `../api/index.md` |
| features/ | `../concepts/file.md` | `file.md` | `../architecture/file.md` | `../guides/file.md` | `../api/index.md` |
| architecture/ | `../concepts/file.md` | `../features/file.md` | `file.md` | `../guides/file.md` | `../api/index.md` |
| guides/ | `../concepts/file.md` | `../features/file.md` | `../architecture/file.md` | `file.md` | `../api/index.md` |
| api/ | `../concepts/file.md` | `../features/file.md` | `../architecture/file.md` | `../guides/file.md` | — |

## Reserved Files

| File | Purpose |
|------|---------|
| `index.md` | Content-oriented catalog — list every page by section |
| `log.md` | Append-only chronological record of all operations |
| `SCHEMA.md` | This wiki's governance conventions (do not modify without user approval) |

## Directory Layout

```
wiki/votean-wiki/
├── SCHEMA.md
├── index.md
├── log.md
├── concepts/       — domain entities and vocabulary
├── features/       — product features
├── architecture/   — system design
├── api/            — endpoint and contract documentation
└── guides/         — developer how-to pages
```

## Conventions

- Write in present tense.
- One concept per page; prefer many small pages over large catch-all pages.
- Every claim should be traceable to a source (code, PR, conversation, or external doc).
- Cross-link liberally; a broken link is better than a missing link.
- Humans curate sources and ask questions; you handle the writing and maintenance.
