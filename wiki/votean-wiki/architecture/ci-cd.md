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
  - title: app/finder/.nvmrc
    resource: app/finder/.nvmrc
  - title: app/finder/Dockerfile
    resource: app/finder/Dockerfile
  - title: "Issue #489 — align Node.js versions between CI and Docker"
    resource: https://github.com/theneongrey/finder/issues/489
---

# CI/CD

A single GitHub Actions workflow (`ci.yml`) handles continuous integration and production build.

## Pipeline

**Name**: CI-Test  
**Triggers**: push to `main`, manual `workflow_dispatch`

```
job: test                          → job: build
  ubuntu-latest                       ubuntu-latest (needs: test)
  .NET 9.x                            .NET 9.x
  dotnet test --configuration Release check .nvmrc == Dockerfile node:<version>
    (working-directory: ./api)        Node.js from app/finder/.nvmrc (npm cache)
                                        npm ci
                                        npm run build:production
                                        (working-directory: ./app/finder)
                                      dotnet build --configuration Release
                                        (working-directory: ./api)
```

The `build` job only runs when `test` passes. A failing backend test blocks the entire build.

## Node.js Version

`app/finder/.nvmrc` is the single source of truth for the frontend's Node.js version (currently `24.14`).

- **CI** — `actions/setup-node@v4` reads it via `node-version-file` and caches npm downloads (`cache: npm`, keyed on `app/finder/package-lock.json`). Dependencies are installed with `npm ci`, so an out-of-sync lockfile fails CI the same way it would fail the Docker build.
- **Docker** — `app/finder/Dockerfile` builds on `node:<version>-alpine`. Docker can't read `.nvmrc`, so the version is repeated there.
- **Guard** — the first step of the `build` job ("Check Node version matches Dockerfile") compares `.nvmrc` with the version in the Dockerfile's `FROM node:` line and fails with an annotation on the Dockerfile if they differ.

To bump Node, change `.nvmrc` and the Dockerfile's `FROM` line in the same commit. Because the workflow has no `pull_request` trigger, a mismatch surfaces on the push to `main` (or on a manual `workflow_dispatch` run of a branch).

## What's Not in CI

- **E2E tests (Playwright)** are not part of the pipeline — they require a running backend and frontend, and run locally only.
- **Frontend unit tests** (`ng test`) are not in CI either. The frontend is E2E-only by design (see [Testing](../guides/testing.md#frontend-unit-tests--none-by-design)).

## Related

- [Testing](../guides/testing.md) — full testing stack (xUnit, Playwright, Karma setup)
- [Backend](backend.md) — `dotnet test` target
- [Frontend](frontend.md) — `npm run build:production` target
