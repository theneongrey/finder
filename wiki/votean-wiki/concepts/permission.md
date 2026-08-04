---
type: Concept
title: Permission
description: A per-project role assignment linking a User to a Project with Voter, Maintainer, or Owner access
tags: [domain, permission, roles, auth]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: Permission entity
    resource: api/Finder/Business/Permission/Entities/Permission.cs
---

# Permission

A Permission record links a [User](user.md) to a [Project](project.md) with a specific role. The composite primary key is `(PersonKey, ProjectKey)` — one record per person per project.

## Roles

Three explicit roles exist (stored as `PermissionType`):

- **Voter** — can vote and comment
- **Maintainer** — can also edit polls and options
- **Owner** — can also manage sharing and roles

The project's `Creator` field grants implicit full rights without a Permission record.

## Design Note

Because the hierarchy is numeric (Voter=0, Maintainer=1, Owner=2), permission checks use `>=` comparisons rather than role-name equality. This means a single threshold check covers all higher roles automatically.

## Related

- [Permissions](../features/permissions.md) — full feature description
- [User](user.md) — the person the permission belongs to
- [Project](project.md) — the project being accessed
