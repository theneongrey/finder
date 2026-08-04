---
type: Feature
title: Authentication
description: Passwordless magic-link email login — token or OTP code exchange for a session cookie
tags: [auth, login, security, cookie]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: LoginService
    resource: api/Finder/Business/Auth/Services/LoginService.cs
  - title: AuthApi
    resource: api/Finder/Business/Auth/Api/AuthApi.cs
---

# Authentication

Votean uses a passwordless flow. No passwords are stored. Every login starts with an email request that delivers both a clickable magic link (token) and a 6-digit OTP code. Either path produces the same outcome: a session cookie.

## Flow

```
POST /api/auth/requestLoginMail
  → creates LoginToken record (token + code, expires 1 hour)
  → sends email with magic link and OTP

  Path A — click link in email:
    POST /api/auth/tokenLogin  { loginToken }
    → validates token, calls SignIn

  Path B — enter code manually:
    POST /api/auth/codeLogin  { email, loginCode }
    → validates code (max 3 retries), calls SignIn

SignIn:
  → issues cookie "login" (30-day sliding expiry)
  → deletes LoginToken record (one-time use)
  → returns optional redirectUrl
```

## Session

Authentication state is a cookie named `"login"` with 30-day sliding expiry. The backend validates it on every request and extracts the user's `PersonId` and `Role` from the cookie claims. There is no JWT.

`GET /api/auth/who` returns the current user or an empty response when unauthenticated. The frontend calls this on startup to hydrate the user store (see [Frontend](../architecture/frontend.md) for the store architecture).

## Security Details

- **Token expiry**: 1 hour from creation
- **OTP retry limit**: 3 attempts; code is cleared on the third failure (token still exists but is code-invalid)
- **Rate limiting**: 5 requests/IP/minute on `requestLoginMail` and `tokenLogin` — returns 429
- **Logout**: `POST /api/auth/logout` → `SignOutAsync()`, cookie cleared

## Test Environment Bypass

Users with `Role.TestUser` never receive real emails. For local development, navigate directly to:

```
http://localhost:4200/auth/token-login?token=1234
```

after submitting any allowed email. This works because the backend sets a fixed token value (`1234`) in the testing environment.

Test accounts: `testuser1@neongrey.de`, `testuser2@neongrey.de`.

## Related

- [Login Token](../concepts/login-token.md) — the short-lived record that backs each login attempt
- [User](../concepts/user.md) — the Person entity created or looked up during login
- [Backend](../architecture/backend.md) — cookie auth scheme configuration
- [Local Setup](../guides/local-setup.md) — how to run the app and log in during development
