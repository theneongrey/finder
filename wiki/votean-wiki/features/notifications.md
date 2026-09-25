---
type: Feature
title: Notifications
description: In-app notification centre, per-user notification settings, and the multi-language HTML email pipeline that back poll and permission events
tags: [notifications, email, in-app, feature, backend, frontend]
status: stable
generated:
  actor: claude-opus-4-8
  date: 2026-09-25
stale_after: 2027-03-25
sources:
  - title: "PR #367 — in-app notification system"
    resource: https://github.com/theneongrey/finder/pull/367
  - title: "PR #358 — HTML email templates with multi-language support"
    resource: https://github.com/theneongrey/finder/pull/358
  - title: "PR #349 — settings page redesign (notification settings)"
    resource: https://github.com/theneongrey/finder/pull/349
  - title: InAppNotificationService
    resource: api/Finder/Business/User/Services/InAppNotificationService.cs
  - title: MailTemplateService
    resource: api/Finder/Business/Shared/Services/MailTemplateService.cs
  - title: user-in-app-notifications feature (polling store)
    resource: app/finder/src/app/common/data/user-in-app-notifications.feature.ts
---

# Notifications

Votean notifies users about poll and permission events through two channels — an **in-app
notification centre** and **email** — coordinated by per-domain notification orchestrators.
Users control which emails they receive through **notification settings**.

## Orchestration

Each domain has a general `*NotificationService` that decides *what* happened and fans out to
the specialized senders:

- `ProjectNotificationService` — poll events (closed, reopened, updated, new comment)
- `PermissionNotificationService` — sharing / permission events

These orchestrators trigger the specialized senders (in-app writer + mail sender); the
specialized services never depend back on the orchestrator. A `NotificationMailGuard` skips
**email** for `Role.TestUser` accounts, but in-app notifications are still written — so test
users (`testuser1@neongrey.de`, `testuser2@neongrey.de`) receive in-app notifications even
though they never get email. Poll updates are debounced/batched through
`PollUpdateNotificationQueue`.

## In-App Notifications

**Backend.** `UserNotification` is stored in PostgreSQL as **JSONB** (via
`NpgsqlDataSourceBuilder.EnableDynamicJson()`); its `Variables` bag uses a value converter so
the SQLite-backed test suite can round-trip it too. `InAppNotificationService` writes and
reads notifications. Endpoints (`Business/User/Api/UserApi.cs`):

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/user/notifications` | list the current user's notifications |
| `DELETE` | `/api/user/notifications/{id}` | dismiss one notification |
| `DELETE` | `/api/user/notifications` | clear all |

**Frontend.** The `withInAppNotificationsFeature` NgRx Signals store feature
(`user-in-app-notifications.feature.ts`) polls `GET /api/user/notifications` every **30 s**
(`timer(0, 30_000)`). `NotificationsPanelComponent` (in the title bar) shows a badge count,
per-notification items (icon, translated text, relative timestamp) and a mark-all-as-read
action. Clicking a notification marks it read and navigates to the poll; opening a poll
detail page auto-clears that poll's notifications.

## Notification Settings

Users choose per-event email preferences, stored as `NotificationSetting` /
`PersonNotificationSetting` rows with a `NotificationValue` (e.g. `on`, `off`, `favOnly`).

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/user/notifications/settings` | load the user's settings |
| `PUT` | `/api/user/notifications/settings/{id}` | update one setting |

The [Settings page](../guides/design-system.md) surfaces these as toggle rows (redesigned in
PR #349) alongside profile name and language, all auto-saving.

## Email Templates (multi-language)

`MailTemplateService` (`Business/Shared/Services/`) loads email bodies from **embedded HTML
templates**, resolving by language with an **`en` fallback**. Templates live under
`Business/Shared/Templates/{lang}/` for **en / de / es**:

`login`, `login-new`, `new-comment`, `permission-removed`, `permission-shared`,
`permission-shared-invited`, `permission-update`, `poll-closed`, `poll-reopened`,
`poll-updated`.

Subjects stay configurable in `appsettings.json`; only the body text moved into templates.
**Adding a language** is a matter of dropping a `Templates/{lang}/` folder — anything missing
falls back to `en`. User-controlled values interpolated into a template must be HTML-encoded
(`WebUtility.HtmlEncode`) to prevent injection.

## Related

- [Authentication](auth.md) — login / magic-link emails use the same template pipeline
- [Permissions](permissions.md) — sharing events that trigger notifications
- [Polling](polling.md) — poll events that trigger notifications
- [Backend](../architecture/backend.md) — service layout and DI
