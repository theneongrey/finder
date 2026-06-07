# Finder API — Permissions Reference

## Permission Levels

| Level | Value | Description |
|-------|-------|-------------|
| **Voter** | 0 | Read access and voting rights on a project |
| **Maintainer** | 1 | Everything Voter can do, plus manage topics and options |
| **Owner** | 2 | Everything Maintainer can do, plus manage project settings and user permissions |

In addition to these three levels there are two special roles:

- **Creator** — the user who created the project. Implicitly has full control, equivalent to Owner, and cannot be removed.
- **Public access (VisibleForEverbody)** — when a project has public visibility, any authenticated user who accesses it is automatically granted Voter permission.

---

## Auth Endpoints

No project permission required — these are public or require only a valid session.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/requestLoginMail` | None | Request a magic-link login email |
| POST | `/api/auth/tokenLogin` | None | Log in via magic-link token |
| POST | `/api/auth/codeLogin` | None | Log in via one-time code |
| GET | `/api/auth/who` | None | Return the current user (empty if not logged in) |
| POST | `/api/auth/logout` | None | Log out |
| POST | `/api/auth/name` | Authenticated | Set the current user's display name |

---

## Project Endpoints

| Method | Endpoint | Required Permission | Description |
|--------|----------|---------------------|-------------|
| GET | `/api/project` | Authenticated | List all projects the user is a Creator or member of |
| GET | `/api/project/{id}` | Voter / Creator / Public | Get project details; public projects auto-grant Voter |
| POST | `/api/project` | Authenticated | Create a new project (caller becomes Creator) |
| PUT | `/api/project/{id}` | Owner / Creator | Update project metadata |
| DELETE | `/api/project/{id}` | Owner / Creator | Delete a project |

---

## Topic Endpoints

| Method | Endpoint | Required Permission | Description |
|--------|----------|---------------------|-------------|
| POST | `/api/project/topic` | Maintainer / Owner / Creator | Add a topic to a project |
| GET | `/api/project/topic/{id}` | Voter / Creator / Public | Get topic details |
| DELETE | `/api/project/topic/{id}` | Maintainer / Owner / Creator | Delete a topic |

---

## Option Endpoints

| Method | Endpoint | Required Permission | Description |
|--------|----------|---------------------|-------------|
| POST | `/api/project/topic/option` | Maintainer / Owner / Creator | Add an option to a topic |
| DELETE | `/api/project/topic/option/{id}` | Maintainer / Owner / Creator | Delete an option |

---

## Voting Endpoint

| Method | Endpoint | Required Permission | Description |
|--------|----------|---------------------|-------------|
| PUT | `/api/project/topic/vote/{optionId}` | Voter / Maintainer / Owner / Creator | Cast a vote for an option |

---

## Permission Management Endpoints

| Method | Endpoint | Required Permission | Description |
|--------|----------|---------------------|-------------|
| PUT | `/api/permission/type/{projectId}` | Owner / Creator | Change the project's visibility type |
| PUT | `/api/permission/{projectId}` | Owner / Creator | Add or update a user's permission on the project |

---

## Summary

```
Action                          Voter   Maintainer   Owner   Creator
──────────────────────────────────────────────────────────────────────
View project / topics / options   ✓         ✓          ✓        ✓
Vote on options                   ✓         ✓          ✓        ✓
Add / delete topics                         ✓          ✓        ✓
Add / delete options                        ✓          ✓        ✓
Update project metadata                                ✓        ✓
Delete project                                         ✓        ✓
Manage user permissions                                ✓        ✓
Change project visibility                              ✓        ✓
```
