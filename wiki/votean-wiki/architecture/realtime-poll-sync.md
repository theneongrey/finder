---
type: Architecture
title: Realtime Poll Sync
description: Live collaboration on the poll detail page — SignalR as a presence + change-signalling channel, REST delta endpoint for data, in-place store merge with highlight and edit-guard
tags: [realtime, signalr, presence, polls, backend, frontend, decision-record]
status: stable
generated:
  actor: claude-opus-5-5
  date: 2026-09-27
stale_after: 2027-03-27
sources:
  - title: "Issue #411 — concept: real-time collaboration on the poll detail page"
    resource: https://github.com/theneongrey/finder/issues/411
  - title: "PR #439 — SignalR hub + presence + auth over WebSocket"
    resource: https://github.com/theneongrey/finder/pull/439
  - title: "PR #440 — delta endpoint + change signalling"
    resource: https://github.com/theneongrey/finder/pull/440
  - title: "PR #444 — frontend realtime service, store merge, highlight, edit-guard, presence UI"
    resource: https://github.com/theneongrey/finder/pull/444
  - title: "PR #447 — idle detection + activity heartbeat"
    resource: https://github.com/theneongrey/finder/pull/447
  - title: "PR #450 — realtime collaboration UX fine-tuning"
    resource: https://github.com/theneongrey/finder/pull/450
  - title: "Issue #467 — compute poll delta in SQL"
    resource: https://github.com/theneongrey/finder/issues/467
  - title: PollHub / PollPresenceRegistry / PollChangeNotifier
    resource: api/Finder/Business/Project/RealTime/
  - title: PollService.GetPollDelta
    resource: api/Finder/Business/Project/Services/PollService.cs
  - title: PollRealtimeService
    resource: app/finder/src/app/features/polls/_shared/data/poll-realtime.service.ts
  - title: withPollRealtimeSyncFeature
    resource: app/finder/src/app/features/polls/_shared/data/poll-realtime-sync.feature.ts
  - title: mergePollDelta
    resource: app/finder/src/app/features/polls/_shared/utils/poll-delta-merge.utils.ts
---

# Realtime Poll Sync

The poll detail page is collaborative: users see **who else is on the poll**, and changes by
others (options, votes, comments, poll edits, close/reopen) **appear in place and are
highlighted** without a reload. The manual *Refresh* button on the results toolbar remains as
a fallback.

## Core decision: signalling channel, not data channel

**SignalR carries only presence and "something changed" pings — never poll data.** Data keeps
flowing over REST via a dedicated **delta endpoint**.

```
User B edits option ──▶ REST mutation ──▶ Poll/Option/Comment/Vote service
                                               │ (after SaveChanges)
                                               ▼
                         IPollChangeNotifier ──▶ group "poll:{id}" : PollChanged { pollId, actorUserId, change }
                                               │
      User A's browser ◀── SignalR ────────────┘
            │  drop own echo (actorUserId == self), debounce 300 ms
            ▼
      GET /api/project/poll/{slug}/delta?since=<syncToken>
            │
            ▼
      PollDetailStore.mergeDelta() → patch currentPoll in place + mark changed ids
            │
            ▼
      option/comment flash, live-update toast, presence avatars
```

Why:

- **One contract.** Options and comments reuse the existing REST response shapes; there is no
  second, socket-specific DTO set to keep in sync.
- **One place for authorization.** Visibility rules are enforced by the REST read predicate
  (`WhereReadableBy`); a ping leaks nothing because it contains no data.
- **Robust to lost pings.** A missed ping only delays sync — the next delta (keyed on a token,
  not on the ping) catches up everything since.

## Backend

### PollHub and auth over WebSocket

`PollHub` is mapped at **`/hub/poll`** (`MapProjectHubs()` in `Project/Setup/SetupExtensions.cs`)
behind `RequireAuthorization()`. It reuses the existing **`login` cookie** — the WebSocket
handshake is same-origin, so no new auth mechanism exists.

Hub methods:

| Method | Purpose |
|---|---|
| `JoinPoll(pollId)` | Authorize, add the connection to group `poll:{id}`, register presence, broadcast roster |
| `LeavePoll(pollId)` | Remove from group and registry, re-broadcast roster |
| `ReportActivity(pollId)` | Activity heartbeat for idle detection (no broadcast) — see [Notifications](../features/notifications.md#active-presence-email-suppression) |
| `OnDisconnectedAsync` | Clean up every poll the connection had joined and re-broadcast their rosters |

Server → client events: `PresenceChanged` (roster) and `PollChanged` (change ping).
`PollHub.GroupName(pollId)` is the single source of truth for the group name, shared by the hub
and the notifier.

Notable details:

- **The hub reads the user from `Context.User`, not `UserService`.** `UserService.GetUserId()`
  goes through `IHttpContextAccessor.HttpContext`, which is null inside hub invocations; the
  hub reads the same `NameIdentifier` claim directly.
- **`JoinPoll` uses the same read predicate as the REST poll reads**: public project OR creator
  OR any project permission. Unauthorized joins throw `HubException`.
- `ReportActivity` needs no access check: it is a no-op unless the connection already joined.

### Presence registry

`PollPresenceRegistry` is an in-memory, lock-guarded **singleton** holding
`pollId → connectionId → entry` plus a reverse `connectionId → pollIds` index for disconnect
cleanup. Each entry holds the participant (`{ userId, name, picture }`) and a
**last-activity timestamp** used by idle detection.

- The roster is **deduplicated by user**, so several tabs of one person show as one avatar.
- Presence is process-local **by design**: the API runs as a single instance (see
  [Single-Instance Deployment](single-instance.md) for the rationale and the scale-out checklist).

### Change signalling

`IPollChangeNotifier.PollChanged(pollId, actorUserId, change?)` wraps `IHubContext<PollHub>` and
is called **after** each successful mutation in `PollService` (update, close, reopen),
`OptionService` (add, update, delete), `CommentService` (add) and `VoteService` (vote). It is
purely additive to the e-mail flow (`PollUpdateNotificationQueue`).

- **`actorUserId`** lets the originating client ignore its own echo.
- **`change`** is a `PollChangeInfo { kind, target? }` descriptor (PR #450). `kind` is one of the
  `PollChangeKind` constants (`optionAdded`, `optionRenamed`, `commentAddedOption`, `voteCast`,
  `pollClosed`, …); the client uses it as the key under `project.results.updateToast.*` for the
  live-update toast. `voteCast` has no toast key (votes aren't toasted), and the extra
  `generic` / `genericNoName` keys cover a ping without a known kind or actor name. `target` is the affected option/poll title where the message interpolates it. It is a label,
  not data — the client still fetches the delta.
- **Best-effort:** a broadcast failure is logged, never surfaced — the write has already
  committed, and a 500 would make the caller retry a successful mutation.

### Delta endpoint

`GET /api/project/poll/{slug}/delta?since={iso}` → `PollService.GetPollDelta`, same visibility
predicate as `GET /api/project/poll/{id}` (404 if not readable).

Change detection relies on `BaseEntity.Edited`, which `AppDbContext.SaveChangesAsync` stamps
automatically — **no tombstone tables, no extra columns**:

- **Poll fields** (name, description, option type, close date / closed state) are sent only when
  the poll row itself changed.
- **Options** count as changed when `Option.Edited` **or any of its votes'** `Vote.Edited` is newer
  than the cutoff — a vote doesn't touch its option row. The whole option (with votes) is
  re-sent so the client gets the new tally.
- **Comments** changed since the cutoff are sent in the usual comment shape.
- **`currentOptionIds` / `currentCommentIds`** are the full id sets; anything the client holds
  that is not in them was hard-deleted (options are hard-deleted; deleting an option cascades
  to its comments).
- **`syncToken`** is server `UtcNow` captured *before* the read, so it is never ahead of what the
  response reflects. The client echoes it back as `since`. No `since` → full current set.
- **Overlap window:** the read cutoff is `since − 2 s`, so rows committing right at the token
  boundary aren't missed. The client upserts by id, so re-delivery is harmless.
- **`highlightedOptionIds` / `highlightedCommentIds`** are the stricter "changed strictly after
  `since`" subset. Items re-sent only because of the overlap are upserted but don't flash again.

**Query shape.** One ping makes every viewer fetch a delta within ~300 ms, so the endpoint runs
one delta per viewer per change. To keep that cheap it never loads the full poll graph. Instead
it runs small, separate queries, all `AsNoTracking`:

1. **Access check:** the poll row alone (`WhereReadableBy`). This also yields the poll-level fields.
2. **Changed options:** filtered in SQL (`Edited > cutoff` OR `EXISTS` a vote with
   `Edited > cutoff`), with creator, meta and votes + voters included (split query).
3. **Changed comments:** filtered in SQL on `Edited > cutoff`, with author and option.
4. **Id sets:** projections only (`Id, Text` for options, needed for the slug; `Id` for comments).

Children are filtered on the shadow `PollId` foreign key, so no query joins `Polls`. A delta
with no changes reads only the poll row and the two id sets. The response contract is unchanged.

The full poll read (`IncludeDetails()`, used by `GET /api/project/poll/{slug}` and close/reopen)
uses `AsSplitQuery()`. Options and comments are sibling collections, so a single JOIN would return
options × votes × comments rows.

## Frontend

### PollRealtimeService

`PollRealtimeService` (`features/polls/_shared/data/`, root-provided) owns one shared
`HubConnection` (`withAutomaticReconnect`).

- `joinPoll(id)` / `leavePoll(id)` — track the active poll; the connection stays open for reuse.
- `presence` — a signal with the current roster.
- `pollChanged$` — change pings, **with self-originated pings filtered out** by comparing
  `actorUserId` to `UserStore.user().id`. (This is why `PersonResponse` / the frontend `User`
  model carry an `id` since PR #444.)
- **Reconnect:** SignalR groups are per connection id, so `onreconnected` re-invokes `JoinPoll`
  for the active poll.
- **Activity heartbeat:** while a poll is joined, `pointerdown` / `keydown` / `scroll` /
  `pointermove` listeners on `document` fire `ReportActivity`, throttled to
  `POLL_ACTIVITY_HEARTBEAT_SECONDS` (20 s). Interactions in a hidden tab are ignored so a
  backgrounded tab ages into idle server-side. The throttle window only advances after a send
  succeeds, so failed sends retry on the next interaction. The app is **zoneless**, so these
  high-frequency listeners never trigger change detection; the handler touches no signals.

In dev, `proxy.conf.json` forwards `/hub/**` to the API with `ws: true`.

### Store: mergeDelta, highlight, edit-guard

`withPollRealtimeSyncFeature()` is a signal-store feature composed into `PollDetailStore`. It
holds `syncToken`, `changedOptions` (id → `added` / `updated` / `removed`), `changedCommentIds`,
`editingOptionIds` and `lingeringOptions`.

- **`mergeDelta(slug)`** fetches the delta with the current token and applies it via the pure
  `mergePollDelta()` util: upsert options/comments by id, drop ids missing from the
  `current*Ids` sets, apply poll-level fields. Unlike `getPoll`, it **never blanks
  `currentPoll`**, so there is no flicker.
- **Option identity is the stable id at the end of the slug**, not the whole slug — a rename
  changes the slug, and matching on the stable id keeps it a single in-place update.
- **Baseline sync:** the first delta after entering a poll (no token yet) only captures the token
  and reconciles data, **without highlighting**, so nothing flashes on entry. It may land before
  `getPoll` resolves; then only the token is stored.
- **Highlight:** each changed item flashes for `HIGHLIGHT_DURATION_MS` (5 s) on its own timer
  (green = added, accent/teal = updated, red = removed; colours from design tokens, respecting
  `prefers-reduced-motion`). A comment on an option also flashes that option. A remotely removed
  option **lingers** in `displayOptions` at its former position until its red flash ends — it is
  already gone from `currentPoll.options`, so voting and results never see it. A newly added
  option takes the spotlight: earlier `updated`/`added` flashes are cleared.
- **Edit-guard:** `startEditingOption` / `stopEditingOption` bracket an inline edit. Remote changes
  to an option being edited are stashed (keyed by stable id) instead of applied, then applied —
  and flashed — when the edit ends. An option deleted remotely while being edited survives until
  the edit ends and is then reconciled out by the next delta.
- `resetRealtimeState()` clears everything when leaving a poll.

### Page wiring and presence UI

`PollDetailComponent` joins the poll on entry (and leaves the previous one when navigating
between polls), resets realtime state, and fires the baseline `mergeDelta`. `pollChanged$` is
**debounced 300 ms** so a burst of pings collapses into one delta fetch.

- **Live-update toast:** while the tab is visible, a change by someone else shows a specific,
  translated toast built from `change.kind` + actor name + `target` (dark pill via the global
  `toast-update` class). Votes (`voteCast`) are not toasted — they already show on the cards.
- **Presence avatars:** `PresenceAvatarsComponent` (feature component in `polls/_shared/ui/`)
  renders the roster in the results toolbar, excludes the local user by id, caps at 3 with a
  "+N" bubble, and shows name tooltips. It renders nothing when nobody else is present.
- The comment button flashes when someone adds a poll-level comment; an option gets an accent
  ring when someone comments on it (PR #450).

## Related

- [Notifications](../features/notifications.md) — e-mail suppression for actively-present users
- [Polling](../features/polling.md) — user-facing poll detail behaviour
- [Poll Detail Page Rebuild](poll-detail-rebuild.md) — the page this sync runs on
- [Frontend Architecture](frontend.md) — stores and feature layout
- [Backend](backend.md) — service layout and DI
- [API Overview](../api/index.md) — delta endpoint and hub route
