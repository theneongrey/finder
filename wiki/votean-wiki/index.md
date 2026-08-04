---
okf_version: "0.2"
type: Index
title: Votean Wiki
description: Content-oriented catalog for the Votean project knowledge base
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
---

# Votean Wiki

Knowledge base for the Votean project — a poll and decision-making application built with ASP.NET Core 9 (backend) and Angular 21 (frontend).

See [SCHEMA.md](SCHEMA.md) for wiki conventions and [log.md](log.md) for the change history.

---

## Concepts

Core domain vocabulary and entities.

- [Poll](concepts/poll.md) — the central voting construct
- [Option](concepts/option.md) — a choice within a poll
- [Vote](concepts/vote.md) — a user's selection on an option
- [Project](concepts/project.md) — grouping container for polls
- [User](concepts/user.md) — authenticated participant
- [Login Token](concepts/login-token.md) — short-lived magic-link + OTP record
- [Permission](concepts/permission.md) — per-project role assignment

## Features

Product capabilities from a user perspective.

- [Authentication](features/auth.md) — magic-link email login flow
- [Polling](features/polling.md) — creating and running polls
- [Permissions](features/permissions.md) — voter / maintainer / owner roles
- [Appointment Polls](features/appointment-polls.md) — date/time scheduling variant
- [Public Sharing](features/public-sharing.md) — unauthenticated access via /p/:projectId

## Architecture

System design and technical decisions.

- [Backend](architecture/backend.md) — ASP.NET Core 9, Minimal API, feature-based layout
- [Frontend](architecture/frontend.md) — Angular 21, standalone components, NgRx Signals
- [Database](architecture/database.md) — PostgreSQL, EF Core 9, migration strategy
- [CI/CD](architecture/ci-cd.md) — GitHub Actions pipeline

## API

Endpoint contracts and request/response shapes.

- [API Overview](api/index.md) — base URL, auth headers, conventions

## Guides

Developer how-to pages.

- [Local Setup](guides/local-setup.md) — running backend and frontend locally
- [Testing](guides/testing.md) — unit tests, integration tests, e2e tests
- [Adding a Feature](guides/adding-a-feature.md) — step-by-step walkthrough
