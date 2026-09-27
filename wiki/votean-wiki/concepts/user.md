---
type: Concept
title: User
description: An authenticated participant — identified by email, holds a system Role and a language preference
tags: [domain, user, auth, person]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: Person entity
    resource: api/Finder/Business/Auth/Entities/Person.cs
  - title: User model (frontend)
    resource: app/finder/src/app/common/models/user.model.ts
---

# User

A User (stored as `Person` on the backend) is any authenticated person in the system. Users are identified by email address and created automatically on first login.

## System Roles

Users carry a system-level `Role` distinct from per-project [permissions](permission.md):

| Role | Description |
|------|-------------|
| `Admin` | Full system access |
| `Upgraded` | Enhanced account tier |
| `Free` | Standard account |
| `TestUser` | Test accounts — never receive real emails |

Test accounts (`testuser1@neongrey.de`, `testuser2@neongrey.de`) use `Role.TestUser`. The backend skips email delivery for this role, enabling the `token=1234` login bypass in development.

## Language

Each user stores a language preference (`en`, `de`, `es`). This is set in the user profile and drives the frontend's date format:

| Language | Date format |
|----------|------------|
| en | M/d/yyyy |
| de | dd.MM.yyyy |
| es | dd/MM/yyyy |

## Profile

Users can update their display name and language via `PUT /api/user`. An optional profile picture URL can be stored (sourced externally).

## Blocking

`Person.IsBlocked` (with `BlockedAt`) locks an account permanently. It is currently set only by
the [feedback](../features/feedback.md#limits-and-blocking) protection, after a third scripted
submission burst. A blocked person:

- gets `403` from `POST /api/auth/requestLoginMail`, and no mail is sent;
- can't log in with an existing token or code: the token is deleted and the request returns `401`;
- loses an existing session. The cookie's `OnValidatePrincipal` asks `BlockedUserCache` (a
  1-minute `IMemoryCache` entry per person, invalidated when the block is set) and rejects the
  principal, so the next request is anonymous. An open SignalR connection stays up until it
  reconnects.

There is no admin UI yet; unblocking is a DB change.

## Per-Project Roles

System roles are separate from project roles. A user's access to a specific project is controlled by a [Permission](permission.md) record (Voter, Maintainer, Owner) or by being the project Creator.

## Related

- [Authentication](../features/auth.md) — how users log in
- [Login Token](login-token.md) — the record created during the login flow
- [Permission](permission.md) — per-project role assignment
- [Feedback](../features/feedback.md) — per-person `FeedbackPreference` (tab hidden, lock, strikes) and the source of blocks
