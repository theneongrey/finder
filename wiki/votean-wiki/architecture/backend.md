---
type: Architecture
title: Backend
description: ASP.NET Core 9 Minimal API — feature-based domain layout, Result<T> pattern, no AutoMapper, cookie auth
tags: [backend, dotnet, aspnet, minimal-api]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: api/Finder/Business
    resource: api/Finder/Business/
  - title: Program.cs
    resource: api/Finder/Program.cs
---

# Backend

The backend is ASP.NET Core 9 using Minimal APIs. There is no controller layer. Business logic is organised by domain under `Business/`.

## Domain Layout

Each domain follows this internal structure:

```
Business/<Domain>/
  Entities/         — domain models (EF Core entities)
  Configuration/    — IEntityTypeConfiguration classes
  Api/
    Requests/       — request DTOs
    Responses/      — response DTOs + ToXxxResponse() extension methods
    <Domain>Api.cs  — Minimal API endpoint registration
  Services/         — business logic
  Setup/            — DI extension method (e.g. AddProjectServices())
```

Domains: `Auth`, `Project`, `Permission`, `User`, `Preview`, `Shared`.

Endpoints are registered in `Program.cs` via extension methods (`WithProjectApi()`, etc.).

## Result&lt;T&gt; Pattern

All service methods return `Result<T>`:

```csharp
Result<T>.Success(payload)   // IsSuccess=true, sets Payload
Result<T>.Fail(statusCode)   // IsSuccess=false, sets Code
```

API endpoints inspect `result.IsSuccess` and return the appropriate HTTP status. This keeps error handling uniform without exceptions for expected failure cases.

## No AutoMapper

Response mapping uses static extension methods co-located with response DTOs:

```csharp
// In Responses/ProjectResponse.cs
public static class ProjectMapper {
    public static ProjectResponse ToProjectResponse(this Project entity) { ... }
}
```

No reflection-based mapping. Explicit control over which fields are projected and how.

## Slug IDs

Most entity IDs are 8-character hex strings derived from `Guid.NewGuid().ToString("N")[..8]`. URLs use a full slug in the form `{human-readable-name}-{8-char-hex}`. The backend extracts the raw ID by splitting on `-` and taking the last segment.

## Cookie Authentication

No JWT. The backend issues a cookie named `"login"` on successful sign-in:
- Scheme: `CookieAuthenticationDefaults` ("Cookies")
- Sliding expiry: 30 days
- Claims: `NameIdentifier` (PersonId as GUID string), `Role` (integer)

The `UserService` caches the authenticated user per HTTP request (`_cachedId`, `_cachedUser`) to avoid multiple DB lookups within a single request.

## Preview Service

The `PreviewService` fetches OpenGraph metadata from URLs provided for image-type options:
- 5-second HTTP timeout per URL
- Fallback chain: `og:` properties → `twitter:` properties → standard `<meta>` tags
- Relative image URLs are resolved to absolute before storing

## Rate Limiting

An `"auth"` policy limits auth endpoints to **5 requests/IP/minute**. Exceeded requests return 429.

## Related

- [Database](database.md) — EF Core configuration and PostgreSQL
- [Authentication](../features/auth.md) — cookie auth flow
- [Permissions](../features/permissions.md) — enforcement in ProjectService and PermissionService
- [Frontend](frontend.md) — Angular app that consumes this API
