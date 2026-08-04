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

## Per-Project Roles

System roles are separate from project roles. A user's access to a specific project is controlled by a [Permission](permission.md) record (Voter, Maintainer, Owner) or by being the project Creator.

## Related

- [Authentication](../features/auth.md) — how users log in
- [Login Token](login-token.md) — the record created during the login flow
- [Permission](permission.md) — per-project role assignment
