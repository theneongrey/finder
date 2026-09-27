---
type: Feature
title: Feedback
description: Left-edge feedback tab that lets logged-in users email a bug report, idea or other note to a configured address, with a per-user option to hide the tab
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
  - title: Feedback mail template
    resource: api/Finder/Business/Shared/Templates/en/feedback.html
  - title: FeedbackStore
    resource: app/finder/src/app/features/feedback/_data/feedback.store.ts
  - title: FeedbackTabComponent
    resource: app/finder/src/app/features/feedback/feedback-tab/feedback-tab.component.ts
---

# Feedback

Logged-in users can send feedback about the app from a small **Feedback tab** fixed to the
**left** screen edge. The feedback is not stored; it is emailed to an address configured on the
backend. Users can hide the tab and turn it back on in Settings.

## User flow

1. The tab (`app-feedback-tab`) is mounted once in `app.component.html`, so it appears on every
   screen while the user is authenticated. It stays hidden on the landing pages (`/`, `/de`,
   `/en`, `/es`), `/auth/*` and `/logout`, and when the user has hidden it.
2. Clicking the tab opens a panel (`app-feedback-panel`) next to it:
   - type: **Bug / Idea / Other** (`ds-segmented-control`)
   - comment (`ds-textarea`, max 2000 characters)
   - an **inline disclosure** listing exactly what is sent: type, comment, name and email, date
     and time, and the current page (the user's email and the page path are filled in)
   - **Cancel** (also ✕ and Esc) and **Send**
   - **Hide button**, which hides the tab and shows a toast pointing to Settings
3. After a successful send, the panel closes and a success toast appears. On failure, the panel
   stays open with the text intact and an error toast appears.

The "page" is the router URL without query string or fragment (e.g. `/polls/abc`).

## Hiding and re-enabling

The "hidden" flag is stored per person in the `FeedbackPreferences` table (see Backend below).
A missing row means the default: the tab is shown. The Settings page has a **Feedback** card with
a `ds-switch` labelled "Show feedback button" to switch it back on.

`FeedbackStore.setButtonHidden` is optimistic: the tab reacts immediately and the previous value
is restored, with an error toast, if the request fails. The preference is loaded when a user
logs in and reset on logout or account switch, keyed on the user's email so profile edits don't
trigger a reload.

## Backend

`Business/Feedback/` is its own domain following the standard
[backend layout](../architecture/backend.md):

| Endpoint | Purpose |
|---|---|
| `GET /api/feedback/preference` | `{ buttonHidden }`, defaulting to `false` when no row exists |
| `PUT /api/feedback/preference` | Upserts `{ buttonHidden }` |
| `POST /api/feedback` | `{ type, comment, page }` → 204. Returns 400 on invalid input and 502 when the mail can't be sent or no recipient is configured |

All three require authentication. `POST` also uses the `"feedback"` rate-limit policy
(5 requests/IP/minute).

- **Entity:** `FeedbackPreference { PersonId (PK, FK → Person, cascade), ButtonHidden }`
  inherits `BaseEntity`. Migration: `AddFeedbackPreference`.
- **`FeedbackType`** enum (`Bug`, `Idea`, `Other`) has its own
  `[JsonConverter(typeof(JsonStringEnumConverter<FeedbackType>))]`. The global string-enum
  converter in `Program.cs` is only registered for MVC controllers, not for Minimal APIs.
- **Mail:** `FeedbackService` validates the input (trimmed, HTML-stripped comment of 1–2000
  characters; page of 1–500 characters; defined enum value) and loads the user. It then sends
  the `feedback` template (English only) through the shared `MailService`. All values go
  through `MailTemplate.Variables`, so `MailTemplateService` HTML-encodes them (see
  [Notifications](notifications.md)). The timestamp is server UTC.
- **Config:** `Feedback:RecipientEmail`, bound to `FeedbackOptions`. It is empty in
  `appsettings.json` and must be set per environment (user secrets or environment variables).

## Tests

- API: `api/Finder.Tests/Feedback/FeedbackApiTests.cs` covers the preference default and
  round-trip, the mail contents, HTML encoding, validation, the missing recipient, and 401s.
- E2E: `e2e/tests/feedback.spec.ts` covers the tab position, the disclosure, cancel/Esc, the
  submit payload (endpoint stubbed), and hide → persist → re-enable in Settings.

## Related

- [User](../concepts/user.md) — the person the preference belongs to
- [Notifications](notifications.md) — the shared mail pipeline and templates
- [Component Library](../guides/component-library.md) — `ds-switch`, `ds-segmented-control`, `ds-textarea`
