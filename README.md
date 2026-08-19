# Votean

> **Find common ground, together.**  
> Votean turns endless group chat debates into clear, fast decisions. Whether furnishing a living room for two, planning a weekend trip for six, picking a group gift, or scheduling a team offsite — ask the question, share the link, and see the result in seconds.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Tech Stack & Architecture](#tech-stack--architecture)
  - [Backend (ASP.NET Core 9)](#backend-aspnet-core-9)
  - [Frontend (Angular 21)](#frontend-angular-21)
- [Local Development Setup](#local-development-setup)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Local Test Authentication](#local-test-authentication)
- [Testing](#testing)
- [Deployment & CI/CD](#deployment--cicd)
  - [Hosting with Dokploy](#hosting-with-dokploy)
  - [CI & Deployment Guardrails](#ci--deployment-guardrails)
- [Documentation & Wiki](#documentation--wiki)

---

## Overview

Making decisions in group chats often results in dozens of messages, lost links, and no clear outcome. **Votean** provides lightweight, frictionless voting where:
- **No passwords are required** — instant login via magic-link email and 6-digit OTP codes. Accounts are automatically created on first sign-in.
- **No app installation needed** — participants simply open a shared link in any browser.
- **Fast and intuitive** — polls are ready in under a minute with rich media options, live participant tracking, and real-time standings.

---

## Key Features

- **Versatile Poll Types**:
  - **Appointment / Date Scheduling**: Find dates and time slots that work for everyone.
  - **Yes / No**: Quick consensus checks.
  - **Rating**: 1-to-5 star ratings for evaluating candidates or proposals.
- **Rich Media & Link Previews**: Add descriptions, external URLs, and preview images to options. An internal preview service extracts OpenGraph and Twitter metadata automatically.
- **Intuitive Voting Experience**: Tinder-style swipe voting or click voting, option skipping, re-voting capabilities, and per-option commenting.
- **Live Progress & Participation**: Real-time indicators of who has voted, who is still missing, and instant standings visibility.
- **Role-Based Access**: Granular permissions per poll/project (`Voter`, `Contributor` / `Maintainer`, `Owner`).
- **Internationalization (i18n)**: Multilingual support for English (`en`), German (`de`), and Spanish (`es`) with localized date formatting.

---

## How It Works

```
1. Ask the Question       ───►  2. Share the Link       ───►  3. See the Result
Choose poll type, add           Post a single link into        Watch live who has voted
options & descriptions.         the chat. Voters join with     and review the final
Ready in under a minute.        one email (no password).       decision.
```

---

## Tech Stack & Architecture

### Backend (ASP.NET Core 9)

Located in `api/Finder/`:

- **Framework**: C# / ASP.NET Core 9 Minimal APIs (no controller layer; endpoints registered via `With<Domain>Api()` extensions).
- **Domain-Driven Layout** under `Business/<Domain>/`:
  - `Auth/`: Magic-link email login, OTP token verification, allowed email list.
  - `Project/`: Projects, standalone polls, topics, options, and voting logic.
  - `Permission/`: Project-level permissions and role enforcement.
  - `User/`: User profile management and settings.
  - `Preview/`: OpenGraph / metadata scraping service for option URLs.
  - `Shared/`: Base entity definitions (`BaseEntity` with automatic `Created`/`Edited` timestamps), common utilities, and `Result<T>` pattern.
- **Database**: PostgreSQL with Entity Framework Core 9 (`Npgsql.EntityFrameworkCore.PostgreSQL`).
- **Patterns**:
  - `Result<T>` pattern for uniform service responses without throwing exceptions for control flow.
  - Static extension mappers (e.g., `ToProjectResponse()`) co-located with DTOs — no reflection-based AutoMapper.
  - Entity IDs use 8-character hex slug identifiers (`{name}-{8-char-hex}`).
  - Cookie-based authentication (`"login"` sliding cookie, 30-day lifetime) with per-request user caching.
  - Rate limiting (5 requests / IP / minute on auth endpoints).

### Frontend (Angular 21)

Located in `app/finder/`:

- **Framework**: Angular 21 with 100% standalone components (no `NgModules`) and `OnPush` change detection strategy.
- **State Management**: NgRx Signals (`@ngrx/signals`) with `rxMethod`, `switchMap`, and `tapResponse`. Async side effects live strictly in stores (`UserStore`, `ProjectListStore`, `ProjectDetailStore`).
- **Styling**: Tailwind CSS 4 with dedicated CSS custom design tokens.
- **Component Architecture**: Three-tier component hierarchy:
  1. `@ds/*` (`common/ui/ds-components/`): Pure presentational design system primitives wrapping Spartan UI primitives.
  2. `@smart/*` (`common/ui/smart-components/`): Shared smart components with domain awareness (e.g., `app-user-avatar`, `app-title-bar`).
  3. Domain feature components (`features/<domain>/`): Feature-specific views and stores.
- **Modern Angular Features**: Native control flow syntax (`@if`, `@for` with mandatory `track`, `@switch`), lazy-loaded routes, and `@ngx-translate` for multilingual localization.

---

## Local Development Setup

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js](https://nodejs.org/) (v20+ recommended) & `npm`
- [PostgreSQL](https://www.postgresql.org/) database instance

### Backend Setup

```bash
# Navigate to the backend directory
cd api/Finder

# Build the project
dotnet build

# Apply database migrations
dotnet ef database update

# Run the API server (starts on http://localhost:5192)
dotnet run
```

### Frontend Setup

```bash
# Navigate to the frontend directory
cd app/finder

# Install dependencies
npm install

# Start development server (serves on http://localhost:4200 with API proxy)
npm start
```

---

## Testing

### Backend Unit & Integration Tests

```bash
# Run backend test suite
cd api
dotnet test
```

### Frontend End-to-End Tests (Playwright)

```bash
# Ensure both backend (dotnet run) and frontend (npm start) are running
cd e2e
npx playwright test
```

---

## Deployment & CI/CD

### Hosting with Dokploy

The production instance is hosted on a VPS and managed via [Dokploy](https://dokploy.com/):

- **Continuous Deployment**: Every push to the `main` branch automatically triggers Dokploy.
- **Containerization**: Dokploy builds and runs two separate Docker containers:
  - **App Container**: Angular frontend application.
  - **API Container**: ASP.NET Core backend service.

### CI & Deployment Guardrails

- **GitHub Actions (`ci.yml`)**:
  - Configured to run backend tests and build checks on push to `main`.
  - Because basic/free GitHub accounts do not support required branch protection rules for this repository setup, the workflow currently acts as a post-merge check to detect build or test failures after merging into `main`.
  - This is acceptable while the application is in demo/non-production status.
- **Deployment Guardrail**:
  - The primary deployment guardrail is that Docker container builds will fail if compilation or build errors occur, preventing a broken container from deploying.
- **Known Limitation / Out-of-Sync Risk**:
  - Because frontend and backend Docker containers build and deploy independently in Dokploy, an error affecting only one container can cause that container's build to fail while the other succeeds.
  - In such cases, the frontend and backend can temporarily become out of sync. This is accepted for the current demo stage.

---

## Documentation & Wiki

Detailed specifications, architecture records, and developer guides are maintained in the project wiki under `wiki/votean-wiki/`:

- **Architecture**:
  - [Backend Architecture](wiki/votean-wiki/architecture/backend.md)
  - [Frontend Architecture](wiki/votean-wiki/architecture/frontend.md)
  - [Database & Migrations](wiki/votean-wiki/architecture/database.md)
  - [Component Architecture](wiki/votean-wiki/architecture/component-architecture.md)
  - [CI/CD Pipeline](wiki/votean-wiki/architecture/ci-cd.md)
- **Guides**:
  - [Local Setup Guide](wiki/votean-wiki/guides/local-setup.md)
  - [Testing Guide](wiki/votean-wiki/guides/testing.md)
  - [Adding a Feature](wiki/votean-wiki/guides/adding-a-feature.md)
  - [Design System & Component Library](wiki/votean-wiki/guides/component-library.md)
- **Domain Concepts**:
  - [Poll](wiki/votean-wiki/concepts/poll.md) · [Option](wiki/votean-wiki/concepts/option.md) · [Vote](wiki/votean-wiki/concepts/vote.md) · [User](wiki/votean-wiki/concepts/user.md) · [Permission](wiki/votean-wiki/concepts/permission.md)
