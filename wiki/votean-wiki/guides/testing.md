---
type: Guide
title: Testing
description: Backend xUnit integration tests, Playwright E2E, and Angular Karma setup
tags: [testing, xunit, playwright, e2e, karma]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: Finder.Tests
    resource: api/Finder.Tests/
  - title: FinderApiFactory
    resource: api/Finder.Tests/Infrastructure/FinderApiFactory.cs
  - title: e2e/tests
    resource: e2e/tests/
  - title: playwright.config.ts
    resource: e2e/playwright.config.ts
---

# Testing

## Backend Integration Tests

**Framework**: xUnit 2.9.2 + `Microsoft.AspNetCore.Mvc.Testing`  
**Run**: `dotnet test --configuration Release` from `./api`

Tests use `FinderApiFactory : WebApplicationFactory<Program>` — a test-only host that replaces PostgreSQL with an in-memory SQLite database. Each test class gets a unique database to ensure isolation.

### Auth in Tests

Real cookie auth is replaced by `TestAuthHandler`. Instead of a cookie, tests send:

```
X-Test-User-Id: <guid>
```

`FinderApiFactory.CreateAuthenticatedClient(userId)` returns an `HttpClient` pre-configured with this header.

### Seed Methods

`FinderApiFactory` exposes helper methods to populate the test database:

| Method | Creates |
|--------|---------|
| `SeedUser(email?)` | `Person` record |
| `SeedProject(creatorId, name?, description?)` | `Project` |
| `SeedPoll(projectId, name?, optionType?, description?)` | `Poll` |
| `SeedOption(pollId, text?, description?, url?)` | `Option` |
| `SeedPermission(projectId, userId, permissionType)` | `Permission` |
| `SeedLoginToken(userId, token, code)` | `LoginToken` |

Tests follow the AAA pattern (Arrange, Act, Assert) and validate both happy-path responses and error codes (401, 403, 404).

### Test Coverage

~42 test cases across 5 files:

| File | Focus |
|------|-------|
| `Auth/AuthApiTests.cs` | Login flows (email request, token, code, logout) |
| `Projects/ProjectApiTests.cs` | Project CRUD, user isolation |
| `Projects/PollApiTests.cs` | Poll and option CRUD, voting |
| `Permissions/PermissionApiTests.cs` | Role assignment, visibility |
| `User/UserApiTests.cs` | Profile updates |

## E2E Tests (Playwright)

**Framework**: Playwright 1.49.0  
**Run**: `npx playwright test` from `./e2e`  
**Requires**: Angular dev server (`npm start`) + backend (`dotnet run`) both running

### Configuration

- Single worker (`workers: 1`) — tests share app state (same DB) and must run serially
- No retries on failure
- 60-second per-test timeout
- Chromium only (Desktop Chrome)
- Base URL: `http://localhost:4200`

### Login Helper

`tests/helpers.ts` provides two test users and shared login/logout functions:

```typescript
export const USER1 = 'testuser1@neongrey.de'
export const USER2 = 'testuser2@neongrey.de'

// login: navigates to request-email, submits, then bypasses code via token-login?token=1234
export async function login(page: Page, email: string): Promise<void>

// logout: clicks avatar menu, follows Logout link
export async function logout(page: Page): Promise<void>
```

Always import from `helpers.ts` — never copy these functions into a spec file.

### Test Setup Pattern

```typescript
test.beforeAll(async ({ browser }) => {
  // idempotent: create test data only if it doesn't exist
  // use a long timeout (90s) for first-run setup
})

test.beforeEach(async ({ page }) => {
  await login(page, USER1)
})

test.afterEach(async ({ page }) => {
  await logout(page)
})
```

## Frontend Unit Tests

The Angular project is configured with Karma + Jasmine (`ng test`) but **no `.spec.ts` files currently exist**. The test runner is wired up and ready if unit tests are added.

## Related

- [CI/CD](../architecture/ci-cd.md) — which tests run in the pipeline (backend only)
- [Local Setup](local-setup.md) — how to start the app for E2E testing
- [Backend](../architecture/backend.md) — the system under test
