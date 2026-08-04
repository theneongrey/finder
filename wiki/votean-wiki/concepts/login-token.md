---
type: Concept
title: Login Token
description: Short-lived record backing each authentication attempt — holds both the magic-link token and the OTP code
tags: [auth, token, otp, security]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: LoginService
    resource: api/Finder/Business/Auth/Services/LoginService.cs
---

# Login Token

A Login Token is created for every `requestLoginMail` call. It is a one-time record that holds both a magic-link token and an OTP code. Once used (either path), the record is deleted.

## Two Paths

| Path | Field used | Endpoint |
|------|-----------|---------|
| Magic link (click in email) | 32-char hex token | `POST /api/auth/tokenLogin` |
| Manual OTP (type in browser) | 6-digit numeric code | `POST /api/auth/codeLogin` |

## Expiry and Invalidation

- Expires **1 hour** after creation
- OTP code is invalidated after **3 failed attempts** (the record survives but code is cleared)
- Record is **deleted** from the database on successful sign-in (one-time use)
- RedirectUrl is stored on the record and returned after successful sign-in so the frontend can navigate to the originally requested page

## Related

- [Authentication](../features/auth.md) — the full login flow
- [User](user.md) — the Person this token belongs to
