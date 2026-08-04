---
type: Architecture
title: CI/CD
description: GitHub Actions pipeline — backend tests gate the production build; E2E tests run locally only
tags: [ci, cd, github-actions, testing]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: .github/workflows/ci.yml
    resource: .github/workflows/ci.yml
---

# CI/CD

A single GitHub Actions workflow (`ci.yml`) handles continuous integration and production build.

## Pipeline

**Name**: CI-Test  
**Triggers**: push to `main`, manual `workflow_dispatch`

```
job: test                          → job: build
  ubuntu-latest                       ubuntu-latest (needs: test)
  .NET 9.x                            .NET 9.x + Node.js 20.x
  dotnet test --configuration Release   npm install
    (working-directory: ./api)          npm run build:production
                                        (working-directory: ./app/finder)
                                      dotnet build --configuration Release
                                        (working-directory: ./api)
```

The `build` job only runs when `test` passes. A failing backend test blocks the entire build.

## What's Not in CI

- **E2E tests (Playwright)** are not part of the pipeline — they require a running backend and frontend, and run locally only.
- **Frontend unit tests** (`ng test`) are not in CI either — no spec files currently exist in the Angular source tree.

## Related

- [Testing](../guides/testing.md) — full testing stack (xUnit, Playwright, Karma setup)
- [Backend](backend.md) — `dotnet test` target
- [Frontend](frontend.md) — `npm run build:production` target
