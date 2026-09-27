---
type: Architecture
title: Single-Instance Deployment
description: Decision record — the API deliberately runs as exactly one instance; which components rely on that and what a scale-out would require
tags: [architecture, deployment, scaling, decision-record, signalr, realtime]
status: stable
generated:
  actor: claude-opus-5-5
  date: 2026-09-27
stale_after: 2027-03-27
sources:
  - title: System architecture review (2026-09-27) — owner decision "presence is process-local on purpose"
    resource: conversation
  - title: PollPresenceRegistry
    resource: api/Finder/Business/Project/RealTime/PollPresenceRegistry.cs
  - title: PollHub / MapProjectHubs
    resource: api/Finder/Business/Project/Setup/SetupExtensions.cs
  - title: Rate limiter policies
    resource: api/Finder/Business/Auth/Setup/SetupExtensions.cs
---

# Single-Instance Deployment

**Decision:** the API runs as **exactly one instance** (one container on the Dokploy VPS). This is
intentional, not an oversight. Several components keep state in process memory and are correct
only because there is a single process.

## Why

- Current and expected load fits one instance comfortably.
- In-process state keeps the realtime layer simple: no Redis, no SignalR backplane, no sticky
  sessions, no distributed locks. That means one less service to host, secure and back up.
- Scale-out is a later, deliberate step with a known checklist (below), not a hidden
  constraint.

## What relies on it

| Component | Process-local state | What breaks with 2+ instances |
|---|---|---|
| `PollPresenceRegistry` ([Realtime Poll Sync](realtime-poll-sync.md#presence-registry)) | who is on which poll, last-activity timestamps | rosters only show users connected to the same instance; active-presence email suppression misfires |
| SignalR groups (`poll:{id}`) | group membership per connection | `PollChanged` pings only reach clients on the instance that handled the write |
| Rate limiter (`auth`, `preview` policies) | fixed-window counters | limits apply per instance, so the effective limit multiplies |
| Poll-update debounce and mail sending ([Notifications](../features/notifications.md#delivery-persisted-queues-never-inline)) | DB-backed queues (`PendingPollUpdates`, `OutboxMails`) drained by in-process dispatchers that claim rows without row locks | two instances could pick up the same row and send a mail twice; claiming would need `FOR UPDATE SKIP LOCKED` |

## What a scale-out would require

1. A **SignalR backplane** (e.g. Redis) so group broadcasts reach every instance, plus **sticky
   sessions** at the proxy for the non-WebSocket transports.
2. A **shared presence store** (e.g. Redis hashes with TTL) replacing `PollPresenceRegistry`.
3. A **distributed rate limiter**, or rate limiting at the proxy (Traefik middleware).
4. Row claiming with `SELECT … FOR UPDATE SKIP LOCKED` in the background dispatchers.
5. Revisit anything else added later that holds per-process state. When you add such state,
   add it to the table above.

## Related

- [Realtime Poll Sync](realtime-poll-sync.md) — presence and change pings
- [Backend](backend.md) — service layout and rate limiting
- [CI/CD](ci-cd.md) — how the single container is built and deployed
