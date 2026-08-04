---
type: Concept
title: Project
description: Named container for polls — controls visibility, members, and creator ownership
tags: [domain, project, container]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: Project entity
    resource: api/Finder/Business/Project/Entities/Project.cs
  - title: ProjectService
    resource: api/Finder/Business/Project/Services/ProjectService.cs
---

# Project

A Project is a named container that groups related [polls](poll.md). Users are granted access at the project level via [Permission](permission.md) records.

## Visibility

Two visibility modes control who can see a project:

| Mode | Who can access |
|------|---------------|
| `VisibleForSelectedOnly` (default) | Only explicitly invited members |
| `VisibleForEverbody` | Any authenticated user with the link (auto-added as Voter on first access) |

## Creator

Every project has a designated `Creator`. The creator always has full ownership rights regardless of the [Permission](permission.md) table — no Permission record is required. The creator is the only user who cannot have their own access removed by others.

## Standalone Projects

A project can be marked `IsStandalone = true`, which means it holds exactly one poll and is created implicitly when a standalone poll is added. Standalone polls appear in the overview's Polls tab and can be shared directly via a public link without exposing a project detail page.

## Slug IDs

Project IDs use the 8-char hex slug format: `{name-slug}-{8-char-hex}`. The backend extracts the raw ID by taking the last `-`-delimited segment.

## Related

- [Poll](poll.md) — polls within a project
- [Permission](permission.md) — member roles
- [Public Sharing](../features/public-sharing.md) — how VisibleForEverbody projects are shared
- [Permissions](../features/permissions.md) — full feature description
