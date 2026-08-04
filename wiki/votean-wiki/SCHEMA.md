---
type: Schema
title: Votean Wiki Schema
description: Governance conventions for the Votean project wiki
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
---

# Votean Wiki — Schema

This file governs how this wiki is structured, maintained, and extended. Do not modify without user approval.

## Format

All non-reserved pages follow OKF (Open Knowledge Format) v0.2:
- YAML frontmatter between `---` delimiters, with at minimum a `type` field
- Free-form markdown body
- Cross-references use standard relative markdown links: `[Display Text](../dir/file.md)`. Do **not** use Obsidian-style `[[WikiLink]]` syntax — it does not render in standard markdown viewers.

## Operations

Three operations drive all wiki changes. Invoke via `/wiki`:

| Operation | Trigger | Effect |
|-----------|---------|--------|
| `ingest <source>` | New source material available | Reads source, updates 5–15 pages, appends to `log.md` |
| `query <question>` | User question | Reads relevant pages, answers with citations |
| `lint` | Periodic maintenance | Checks broken links, orphans, stale pages, contradictions |

## Sections

| Directory | Types of Pages |
|-----------|---------------|
| `concepts/` | Core domain entities: Poll, Option, Vote, Project, User |
| `features/` | Product features: Auth, Polling, Permissions, Appointments |
| `architecture/` | System design: Backend, Frontend, Database, CI/CD |
| `api/` | Endpoint contracts, request/response shapes |
| `guides/` | Developer how-tos: local setup, testing, deployment |

## Reserved Files

- `index.md` — master catalog; updated whenever pages are added or removed
- `log.md` — append-only operation log; never edit past entries
- `SCHEMA.md` — this file

## Naming

- File names: `kebab-case.md`
- Page titles: Title Case
- Tags: lowercase, hyphenated

## Trust Tiers

| Tier | Meaning |
|------|---------|
| `draft` | Generated; not yet human-reviewed |
| `stable` | Human-reviewed or verified against code |
| `deprecated` | Superseded; kept for historical reference |
