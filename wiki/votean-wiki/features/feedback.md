---
type: Feature
title: Feedback
description: Left-edge feedback tab for bug reports, ideas and other notes; submissions are stored and sent to a configured address as one daily digest, with per-user limits, scripted-burst protection and a per-user option to hide the tab
tags: [feedback, email, settings, feature, backend, frontend]
status: draft
generated:
  actor: claude-opus-5-5
  date: 2026-09-27
stale_after: 2027-03-27
sources:
  - title: "Issue #326 — Add a feedback option"
    resource: https://github.com/theneongrey/finder/issues/326
  - title: FeedbackService
    resource: api/Finder/Business/Feedback/Services/FeedbackService.cs
  - title: FeedbackApi
    resource: api/Finder/Business/Feedback/Api/FeedbackApi.cs
  - title: Feedback digest template
    resource: api/Finder/Business/Shared/Templates/en/feedback-digest.html
  - title: FeedbackLimitService
    resource: api/Finder/Business/Feedback/Services/FeedbackLimitService.cs
  - title: FeedbackDigestService
    resource: api/Finder/Business/Feedback/Services/FeedbackDigestService.cs
  - title: FeedbackDigestWorker
    resource: api/Finder/Business/Feedback/Services/FeedbackDigestWorker.cs
  - title: FeedbackStore
    resource: app/finder/src/app/features/feedback/_data/feedback.store.ts
  - title: FeedbackTabComponent
    resource: app/finder/src/app/features/feedback/feedback-tab/feedback-tab.component.ts
---

# Feedback

Logged-in users can send feedback about the app from a small **Feedback tab** fixed to the
**left** screen edge. Submissions are stored and emailed to an address configured on the
backend as **one digest a day at 17:00** (Europe/Berlin). Users can hide the tab and turn it
back on in Settings. Per-user limits and scripted-burst detection protect the endpoint, and
repeated scripted bursts block the account.

## User flow

1. The tab (`app-feedback-tab`) is mounted once in `app.component.html`, so it appears on every
   screen while the user is authenticated. It stays hidden on the landing pages (`/`, `/de`,
   `/en`, `/es`), `/auth/*` and `/logout`, when the user has hidden it, and while feedback is
   disabled for the user (see [Limits and blocking](#limits-and-blocking)). Below the `sm`
   breakpoint it shrinks to an icon-only handle (with an `aria-label`) so it covers less of
   the page.
2. Clicking the tab opens a panel (`app-feedback-panel`) next to it:
   - type: **Bug / Idea / Other** (`ds-segmented-control`)
   - comment (`ds-textarea`, max 2000 characters)
   - an **inline disclosure** listing exactly what is sent: type, comment, name and email, date
     and time, and the current page (the user's email and the page path are filled in)
   - **Cancel** (also ✕ and Esc) and **Send**
   - **Hide button**, which hides the tab. Once the save succeeds, a toast points to Settings.

   Focus moves into the textarea when the panel opens and back to the tab when it closes. Esc
   is handled on the panel itself, so it only closes the panel while focus is inside it.
3. After a successful send, the panel closes and a success toast says the feedback will be
   passed on to the team. On failure, the panel stays open with the text intact and an error
   toast appears. A `429` (limit reached) shows its own toast. A `403` (feedback disabled)
   shows a "temporarily disabled" toast, closes the panel and reloads the preference, which
   hides the tab.

The "page" is the router URL without query string or fragment (e.g. `/polls/abc`).

## Hiding and re-enabling

The "hidden" flag is stored per person in the `FeedbackPreferences` table (see Backend below).
A missing row means the default: the tab is shown. The Settings page has a **Feedback** card with
a `ds-switch` labelled "Show feedback button" to switch it back on.

`FeedbackStore.setButtonHidden` is optimistic: the tab reacts immediately. Saves run in order
(`concatMap`). Once the last queued save settles, the state is set to the last value the server
confirmed, so a failed save rolls back with an error toast and fast toggling can't leave the UI
out of sync with the DB.

The preference is loaded when a user logs in, keyed on their email so profile edits don't
trigger a reload, and reset on logout or account switch. Settings also loads it, so the card
works independently of the tab. A failed load falls back to the default (shown) rather than
leaving the switch on a skeleton.

## Backend

`Business/Feedback/` is its own domain following the standard
[backend layout](../architecture/backend.md):

| Endpoint | Purpose |
|---|---|
| `GET /api/feedback/preference` | `{ buttonHidden, feedbackDisabledUntil }`; `buttonHidden` defaults to `false` when no row exists, and `feedbackDisabledUntil` is only set while the lock is active |
| `PUT /api/feedback/preference` | Upserts `{ buttonHidden }` |
| `POST /api/feedback` | `{ type, comment, page }` → 204 (stored for the digest). 400 on invalid input, 403 while disabled or when the request completes a scripted burst, 429 when a limit is reached |

All three require authentication. `POST` also uses the `"feedback"` rate-limit policy
(5 requests/IP/minute).

- **Entity:** `FeedbackPreference { PersonId (PK, FK → Person, cascade), ButtonHidden,
  FeedbackDisabledUntil, ScriptStrikes }` inherits `BaseEntity`. Migrations:
  `AddFeedbackPreference`, `AddFeedbackDigestAndBlocking`. If two first-time saves race,
  the loser's insert fails the primary-key check and falls back to an update of the row the
  other request created.
- **`FeedbackType`** enum (`Bug`, `Idea`, `Other`) has its own
  `[JsonConverter(typeof(JsonStringEnumConverter<FeedbackType>))]`. The global string-enum
  converter in `Program.cs` is only registered for MVC controllers, not for Minimal APIs.
- **Submission:** `FeedbackService` validates the input (trimmed comment of 1–2000 characters,
  kept verbatim rather than HTML-stripped, since bug reports often quote markup; page of 1–500
  characters; defined enum value), runs `FeedbackLimitService.Check`, and stores a
  `FeedbackSubmission { Id, PersonId (FK, cascade), Type, Comment, Page, SubmittedAt, SentAt }`.
  `SubmittedAt` comes from the injected `TimeProvider` (not `BaseEntity.Created`) so tests can
  drive the clock. The check and the insert run under one app-wide `SemaphoreSlim`, so parallel
  requests from a script can't all pass the limits before any row exists.
- **Digest:** `FeedbackDigestWorker` (a `BackgroundService`, the first in the codebase) wakes
  every `DigestCheckIntervalMinutes` and calls `FeedbackDigestService.SendPendingDigest`. Once
  today's `DigestTime` in `DigestTimeZone` has passed, it sends every unsent submission from
  before that cutoff in one mail (`feedback-digest` template, English only) and sets `SentAt`.
  Each entry shows the type, comment, name, email, local submit time and page. Entries are
  HTML-encoded and inserted as a raw-HTML `items` variable (see
  [Notifications](notifications.md)). The check is idempotent:
  - nothing is sent on a day without feedback;
  - a run missed at 17:00 (app down) is caught up by the next tick;
  - feedback submitted after 17:00 waits for the next day;
  - a failed send or a missing recipient leaves the rows pending for the next tick.

  Sent rows are deleted after 2 days, since the limits only look back 24 h. The worker isn't
  registered in the `Testing` environment; tests call the service directly.
- **Config:** `FeedbackOptions` is bound from `Feedback`: `RecipientEmail` (empty in
  `appsettings.json`, must be set per environment), `DigestTime` (`17:00`), `DigestTimeZone`
  (`Europe/Berlin`) and `DigestCheckIntervalMinutes` (`5`).

## Limits and blocking

`FeedbackLimitService` counts the person's **stored** submissions (rejected attempts don't count):

| Rule | Result |
|---|---|
| `FeedbackDisabledUntil` is in the future | 403 |
| This would be the 3rd submission within **30 seconds** | Treated as a script: `ScriptStrikes++`, `FeedbackDisabledUntil = now + 24h`, and the submission is rejected (403) |
| 5 submissions in the last **30 minutes** | 429 |
| 10 submissions in the last **24 hours** | 429 |

The per-IP `"feedback"` rate-limit policy stays in front of this as an outer layer.

On the **3rd strike** the person is blocked permanently (`Person.IsBlocked`, see
[User](../concepts/user.md#blocking)): no login mails, no logins, and the current session is
dropped on its next request. Unblocking is a manual DB change (`IsBlocked = false`). Also reset
`ScriptStrikes`, or the next burst blocks the person again immediately.

While `feedbackDisabledUntil` is set, the Feedback card in Settings shows "Feedback is
temporarily disabled for your account until …".

## Tests

- API: `api/Finder.Tests/Feedback/FeedbackApiTests.cs` covers the preference default and
  round-trip, validation, and 401s. Two more classes run against an isolated app with a
  `FakeTimeProvider` (`FeedbackTestHost`):
  - `FeedbackLimitTests`: the 30-minute and daily limits, burst → 24 h lock, parallel burst,
    3rd strike → blocked and login refused, and `BlockedUserCache`.
  - `FeedbackDigestTests`: the cutoff, one mail for all pending rows, no resend, rows after the
    cutoff waiting, HTML encoding, a missing recipient, a failed send, and the retention purge.
- E2E: `e2e/tests/feedback.spec.ts` covers the tab position, the disclosure, cancel/Esc, the
  submit payload (endpoint stubbed), hide → persist → re-enable in Settings, the 429 and 403
  toasts, and the hidden tab and Settings note while feedback is disabled.

## Related

- [User](../concepts/user.md) — the person the preference belongs to
- [Notifications](notifications.md) — the shared mail pipeline and templates
- [Component Library](../guides/component-library.md) — `ds-switch`, `ds-segmented-control`, `ds-textarea`
