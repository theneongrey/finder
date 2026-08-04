---
type: Index
title: API Overview
description: All Votean backend endpoints grouped by domain — base URL, auth convention, and full route list
tags: [api, http, rest, endpoints]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: AuthApi.cs
    resource: api/Finder/Business/Auth/Api/AuthApi.cs
  - title: ProjectApi.cs
    resource: api/Finder/Business/Project/Api/ProjectApi.cs
  - title: PermissionApi.cs
    resource: api/Finder/Business/Permission/Api/PermissionApi.cs
  - title: UserApi.cs
    resource: api/Finder/Business/User/Api/UserApi.cs
  - title: PreviewApi.cs
    resource: api/Finder/Business/Preview/Api/PreviewApi.cs
---

# API Overview

**Base URL (dev)**: `http://localhost:5192`  
**Auth**: cookie `"login"` (30-day sliding). The frontend's dev proxy forwards `/api/*` from port 4200 to 5192.  
**Response mapping**: every endpoint returns a dedicated DTO; no generic wrappers except for errors.

## Auth (`/api/auth`)

| Method | Path | Auth required | Description |
|--------|------|:-------------:|-------------|
| `GET` | `/api/auth/who` | no | Returns current user or empty response |
| `POST` | `/api/auth/requestLoginMail` | no | Send magic-link + OTP to email |
| `POST` | `/api/auth/tokenLogin` | no | Exchange magic-link token for session cookie |
| `POST` | `/api/auth/codeLogin` | no | Exchange OTP code for session cookie |
| `POST` | `/api/auth/logout` | yes | Clear session cookie |

## Projects & Polls (`/api/project`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/project` | List all projects the user is a member of |
| `POST` | `/api/project` | Create a project |
| `GET` | `/api/project/:id` | Get project detail (polls, members) |
| `PUT` | `/api/project/:id` | Update project name/description |
| `DELETE` | `/api/project/:id` | Delete project |
| `GET` | `/api/project/standalone-polls` | List standalone polls |
| `POST` | `/api/project/standalone-poll` | Create a standalone poll (auto-creates wrapping project) |
| `GET` | `/api/project/public/:id` | Public project info (no auth) — returns `{ projectId, isStandalone, pollId? }` |
| `POST` | `/api/project/poll` | Create a poll in a project |
| `GET` | `/api/project/poll/:id` | Get poll detail (options, votes, comments) |
| `PUT` | `/api/project/poll/:id` | Update poll name/description/options |
| `DELETE` | `/api/project/poll/:id` | Delete poll |
| `POST` | `/api/project/poll/option` | Add option to a poll |
| `PUT` | `/api/project/poll/option/:id` | Update option text/description/meta |
| `DELETE` | `/api/project/poll/option/:id` | Delete option |
| `PUT` | `/api/project/poll/vote/:optionId` | Cast or update vote — body: `{ choice: string }` |
| `POST` | `/api/project/poll/comment` | Add comment — body: `{ pollId, content, quote? }` |

## Permissions (`/api/permission`)

| Method | Path | Description |
|--------|------|-------------|
| `PUT` | `/api/permission/:projectId` | Share project with a user — body: `{ email, permissionType }` |
| `DELETE` | `/api/permission/:projectId/:email` | Remove a user's access |
| `PUT` | `/api/permission/type/:projectId` | Update project visibility — body: `{ type: VisibilityType }` |
| `GET` | `/api/permission/contacts/:projectId` | Get contact suggestions for sharing |
| `GET` | `/api/permission/invited` | Admin only — list users who haven't logged in yet |

## User (`/api/user`)

| Method | Path | Description |
|--------|------|-------------|
| `PUT` | `/api/user` | Update profile — body: `{ name, language }` |

## Preview (`/api/preview`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/preview` | Fetch OpenGraph metadata for a URL (query param: `url`) |

## Related

- [Backend](../architecture/backend.md) — how endpoints are registered and how auth/mapping works
- [Authentication](../features/auth.md) — auth flow and cookie details
- [Permissions](../features/permissions.md) — role requirements per endpoint
