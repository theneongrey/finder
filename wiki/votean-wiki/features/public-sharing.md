---
type: Feature
title: Public Sharing
description: Unauthenticated access to shared projects via /p/:projectId — auto-adds viewers as Voter
tags: [sharing, public, visibility, link]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: ProjectService.GetPublic
    resource: api/Finder/Business/Project/Services/ProjectService.cs
  - title: app.routes.ts
    resource: app/finder/src/app/app.routes.ts
---

# Public Sharing

Projects with `VisibilityType = VisibleForEverbody` can be shared via a public link. Anyone with the link — even unauthenticated users — can open it.

## Public Route

```
/p/:projectId
```

This route does not require the [AuthGuard](auth.md). On load, the frontend calls:

```
GET /api/project/public/:projectId
→ { projectId, isStandalone, pollId? }
```

Based on the response:
- **Standalone poll** (`isStandalone = true`): routes directly to the vote component for `pollId`
- **Project** (`isStandalone = false`): routes to the project detail view

## Auto-Add as Voter

When an authenticated user accesses a public project for the first time, the backend **silently adds them as Voter**. No confirmation, no email. Subsequent visits recognise them as a project member.

This enables public polls that accumulate a voter list organically as people follow the link.

## Standalone vs Project Polls

A "standalone poll" is a [Poll](../concepts/poll.md) housed in a single-poll [Project](../concepts/project.md) with `IsStandalone = true`. Standalone polls appear in the overview's Polls tab and have a simpler sharing story — the link goes straight to voting rather than showing a project detail page with a poll list.

## Related

- [Permissions](permissions.md) — role system; public access auto-assigns Voter
- [Project](../concepts/project.md) — the entity being shared; holds the VisibilityType
- [Poll](../concepts/poll.md) — the poll reached via a standalone public link
- [Authentication](auth.md) — public routes bypass AuthGuard
