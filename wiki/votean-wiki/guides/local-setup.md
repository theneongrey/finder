---
type: Guide
title: Local Setup
description: Running the backend and frontend locally for development
tags: [setup, dev, local]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
sources:
  - title: CLAUDE.md
    resource: CLAUDE.md
---

# Local Setup

## Backend

Run from `api/Finder/`:

```bash
dotnet build
dotnet run      # listens on http://localhost:5192
```

Migrations are auto-applied at startup — no manual `dotnet ef database update` needed in development.

## Frontend

Run from `app/finder/`:

```bash
npm install
npm start       # ng serve with proxy — API calls forwarded to http://localhost:5192
```

The proxy configuration means the Angular app at `http://localhost:4200` forwards `/api/*` calls to the backend automatically.

## Test Login

Both the backend and frontend must be running. Use either test account:

- `testuser1@neongrey.de`
- `testuser2@neongrey.de`

Steps:
1. Navigate to `http://localhost:4200`
2. Enter the email address and submit
3. Instead of checking email, navigate directly to:  
   `http://localhost:4200/auth/token-login?token=1234`

This works because test users (`Role.TestUser`) use a fixed token value in the development environment and never receive real emails. See [Authentication](../features/auth.md) for the full auth flow.

If you are already logged in, log out first (avatar menu → Logout).

## Related

- [Backend](../architecture/backend.md)
- [Frontend](../architecture/frontend.md)
- [Authentication](../features/auth.md)
- [Testing](testing.md)
