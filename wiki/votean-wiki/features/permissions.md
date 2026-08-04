---
type: Feature
title: Permissions
description: Per-project role system — Voter, Maintainer, Owner, plus implicit Creator rights
tags: [permissions, roles, auth, sharing]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: PermissionService
    resource: api/Finder/Business/Permission/Services/PermissionService.cs
  - title: PermissionApi
    resource: api/Finder/Business/Permission/Api/PermissionApi.cs
  - title: ProjectRole enum
    resource: api/Finder/Business/Project/Api/Responses/ProjectRole.cs
---

# Permissions

Access control in Votean is scoped per project. Each [User](../concepts/user.md) holds one of three explicit roles, plus the project creator holds an implicit fourth.

## Roles

| Role | Can vote & comment | Can edit polls/options | Can manage sharing |
|------|:-----------------:|:---------------------:|:-----------------:|
| **Voter** | ✓ | | |
| **Maintainer** | ✓ | ✓ | |
| **Owner** | ✓ | ✓ | ✓ |
| **Creator** (implicit) | ✓ | ✓ | ✓ |

The role hierarchy is numeric: Voter (0) < Maintainer (1) < Owner (2). Permission checks use `>=` comparisons, so an Owner also passes a Maintainer check.

**Creator** is not stored as a Permission record — the project's `Creator` FK is checked directly. A creator always has full rights regardless of the Permission table.

The API response uses a `ProjectRole` enum that adds `Unknown = 0` and `Creator = 4` for frontend display purposes.

## Inviting Users

Users are invited by email address. If the invitee does not yet have an account, one is created. An invitation email is sent using a template with substitutions for `{{user}}`, `{{project}}`, and `{{permission}}`.

`PUT /api/permission/:projectId` — create or update a user's role (body: `{ email, permissionType }`)

## Removing Access

`DELETE /api/permission/:projectId/:email` — removes the user's Permission record. The project is no longer visible to them.

## Visibility

Projects have two visibility modes (independent of role assignment):

| Mode | Effect |
|------|--------|
| `VisibleForSelectedOnly` (default) | Only invited users can see the project |
| `VisibleForEverbody` | Any authenticated user with the project link can view it |

When a user accesses a public project for the first time, they are **silently auto-added as Voter** — no email is sent, no action is required. This enables frictionless public polls.

`PUT /api/permission/type/:projectId` — toggle visibility (body: `{ type: VisibilityType }`)

## Related

- [Project](../concepts/project.md) — the scope of permissions
- [User](../concepts/user.md) — the person holding the role
- [Public Sharing](public-sharing.md) — how public project links work
