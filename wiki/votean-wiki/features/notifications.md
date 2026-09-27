---
type: Feature
title: Notifications
description: In-app notification centre, per-user notification settings, and the multi-language HTML email pipeline that back poll and permission events
tags: [notifications, email, in-app, feature, backend, frontend]
status: stable
generated:
  actor: claude-opus-4-8
  date: 2026-09-27
stale_after: 2027-03-25
sources:
  - title: "PR #367 — in-app notification system"
    resource: https://github.com/theneongrey/finder/pull/367
  - title: "PR #358 — HTML email templates with multi-language support"
    resource: https://github.com/theneongrey/finder/pull/358
  - title: "PR #349 — settings page redesign (notification settings)"
    resource: https://github.com/theneongrey/finder/pull/349
  - title: "PR #447 — idle detection + suppress notifications while active on poll"
    resource: https://github.com/theneongrey/finder/pull/447
  - title: ProjectNotificationService
    resource: api/Finder/Business/Project/Services/ProjectNotificationService.cs
  - title: InAppNotificationService
    resource: api/Finder/Business/User/Services/InAppNotificationService.cs
  - title: MailTemplateService
    resource: api/Finder/Business/Shared/Services/MailTemplateService.cs
  - title: MailOutbox / MailOutboxDispatcher
    resource: api/Finder/Business/Shared/Services/MailOutboxDispatcher.cs
  - title: PollUpdateNotificationQueue / PollUpdateDispatcher
    resource: api/Finder/Business/Project/Services/PollUpdateDispatcher.cs
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
specialized services never depend back on the orchestrator. The in-app notification is always
written first; then these gates, in order, decide whether email goes out (for poll events they
live together in `ProjectNotificationService.ShouldSendMailAsync`):

- **TestUser skip** — `Role.TestUser` recipients never get email (in
  `ProjectNotificationService` / `PermissionNotificationService`). So test users
  (`testuser1@neongrey.de`, `testuser2@neongrey.de`) get in-app notifications but never
  email.
- **Active-presence skip** (poll events only) — a recipient actively watching the poll page gets
  no email; see [Active-presence email suppression](#active-presence-email-suppression).
- **Per-user settings gate** — `NotificationMailGuard.ShouldSendAsync` checks the recipient's
  `PersonNotificationSetting` (falling back to the `NotificationSetting.DefaultValue`) for the
  event's `NotificationKey`: `All` sends, `Off` suppresses, and `FavOnly` sends only when the
  project is one of the recipient's favorites.

Poll updates are debounced/batched through `PollUpdateNotificationQueue`
(`Notifications:PollUpdateDebounceSeconds`, default 10 s).

### Delivery: persisted queues, never inline

No request talks to SMTP. Both queues live in the database so they survive deploys and restarts:

- **Mail outbox.** Mail senders call `MailOutbox.EnqueueAsync(mail)`, which stores the `Mail`
  (subject, recipient, template name + variables) as JSON in `OutboxMails` and wakes
  `MailOutboxDispatcher`. The dispatcher renders the template and sends it through `MailService`.
  Delivered rows are deleted. A failed send is retried with exponential backoff (1 min, doubling,
  capped at 1 h). After 8 attempts the row is parked with its `LastError` and an error is logged.
  The dispatcher also polls every 30 s, so nothing waits on a signal that was lost.
- **Poll-update debounce.** Each edit merges into the poll's `PendingPollUpdates` row and pushes
  its `DueAt` out by the debounce window. `PollUpdateDispatcher` checks every second, claims due
  rows (a delete that only succeeds if `DueAt` is unchanged) and hands the summary to
  `ProjectNotificationService`, which applies the gates above and enqueues the mails.

Both dispatchers assume a **single API instance**. With several instances, rows would need
claiming with `SELECT … FOR UPDATE SKIP LOCKED`. In the `Testing` environment the background loops
are off; integration tests call `PollUpdateDispatcher.ProcessDueAsync()` and
`MailOutboxDispatcher.DrainAsync()` explicitly before asserting on sent mail.

## Active-presence email suppression

A user who is on a poll's detail page sees changes live (see
[Realtime Poll Sync](../architecture/realtime-poll-sync.md)), so an email about the same change is
just noise. Poll emails are therefore **suppressed for recipients who are actively present** on
that poll (PR #447).

- **Email only.** The in-app notification is always created; only the email is skipped.
- **Per recipient.** Each recipient is checked on their own — others still get email as their
  settings allow.
- **Covers all four poll email types** (updated / closed / reopened / new comment) through one
  check in `ProjectNotificationService`, between the in-app write and `NotificationMailGuard`.
  Permission emails are unaffected.

### Present vs. active vs. idle

Being on the page is not enough — the user must also be **interacting**:

- `PollPresenceRegistry` keeps a last-activity timestamp per connection. `JoinPoll` stamps it
  (arriving counts as activity), and the client's `ReportActivity` heartbeat refreshes it.
- `IsUserActive(pollId, userId, idleThreshold)` is true only if one of the user's connections to
  that poll showed activity within the threshold.
- A **present-but-idle** user (no interaction past the threshold, e.g. a backgrounded tab — the
  client ignores interactions while the tab is hidden) counts as inactive, so their emails
  resume. An absent user always falls through to their settings.

### Configuration

| Setting | Where | Default | Meaning |
|---|---|---|---|
| `Notifications:ActivePresenceIdleSeconds` | `appsettings.json` → `NotificationOptions` | 60 | Server-authoritative idle threshold |
| `POLL_ACTIVITY_HEARTBEAT_SECONDS` | `poll-realtime.model.ts` | 20 | Client heartbeat throttle |

The two values are deliberately **separate**: the heartbeat only has to stay comfortably below
the idle threshold, so exposing the server setting to the client just to share one number
wasn't worth an endpoint.

On the page itself, a change by someone else shows a **live-update toast** while the tab is
visible — the in-page counterpart to the suppressed email.

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
`PersonNotificationSetting` rows with a `NotificationValue` — `all`, `favOnly`, or `off`
(serialized camelCase). A missing per-user row falls back to the setting's `DefaultValue`.

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
- [Realtime Poll Sync](../architecture/realtime-poll-sync.md) — presence registry and activity heartbeat behind the email suppression
- [Backend](../architecture/backend.md) — service layout and DI
