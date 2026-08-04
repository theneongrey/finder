---
type: Concept
title: Vote
description: A user's response to a poll option — stored as a string-encoded choice
tags: [domain, vote, choice]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: Vote entity
    resource: api/Finder/Business/Project/Entities/Vote.cs
  - title: ProjectVoteComponent
    resource: app/finder/src/app/features/project/selected/vote/project-vote.component.ts
---

# Vote

A Vote records one [User](user.md)'s response to one [Option](option.md). There is one vote record per (Person, Option) pair — re-voting overwrites the existing record rather than creating a new one.

## Choice Encoding

The `Choice` field is a free-form string. Its meaning depends on the [Poll](poll.md) type:

| Poll type | Voted value | Skipped value |
|-----------|------------|--------------|
| YesNo | `"yes"` or `"no"` | negative string e.g. `"-1"` |
| Rating | `"1"` through `"5"` | negative string |
| Date | positive string | negative string |

The frontend also uses `null` to represent "never touched" — a state that only exists client-side before the first vote is cast.

## Skip ≠ No Vote

Skipping is a deliberate action distinct from not voting. Skipped options are stored with a negative choice string. The frontend re-shows skipped options up to 2 times before treating them as resolved. See [Polling](../features/polling.md) for the full skip logic.

## Related

- [Option](option.md) — the option this vote is on
- [User](user.md) — the person who cast the vote
- [Poll](poll.md) — the poll context
- [Polling](../features/polling.md) — voting UX, revote mode, skip logic
