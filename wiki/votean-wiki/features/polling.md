---
type: Feature
title: Polling
description: Creating and running polls — three option types, swipe-based voting, skip logic, revote mode
tags: [poll, voting, feature, ux]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: ProjectVoteComponent
    resource: app/finder/src/app/features/project/selected/vote/project-vote.component.ts
  - title: PollOverviewComponent
    resource: app/finder/src/app/features/project/selected/poll-overview/poll-overview.component.ts
  - title: ProjectDetailStore
    resource: app/finder/src/app/features/project/_shared/data/project-detail.store.ts
---

# Polling

Polls are the primary decision-making unit in Votean. Each poll belongs to a [Project](../concepts/project.md) (or is standalone) and contains one or more [Option](../concepts/option.md) entries that users vote on.

## Poll Types (OptionType)

| Value | Name | Description |
|-------|------|-------------|
| 0 | YesNo | Each option gets a yes or no response |
| 1 | Rating | Each option is rated 1–5 |
| 2 | Date | Appointment scheduling — options encode date/time values (see [Appointment Polls](appointment-polls.md)) |

## Voting UX

The vote view (`/vote/:pollId/:optionId?`) shows one option at a time as a swipeable card.

- **Swipe right / tap yes**: cast a positive vote
- **Swipe left / tap no**: skip (not a vote)
- **Swipe threshold**: 75px — below this the card snaps back
- **Visual feedback**: card rotates and fades as it is dragged; left/right cue indicators appear

### Skip Logic

Skipped options are not ignored permanently. The frontend re-shows each skipped option up to **2 times** before considering it done. Once all options have been voted on or skipped twice, the user is routed to results.

Skip state is stored in the session (not persisted to the server). A page refresh resets the skip counter.

### Vote Choice Encoding

Vote choices are stored as strings on the server:

| State | Choice value |
|-------|-------------|
| Never touched | `null` |
| Voted (YesNo) | `"yes"` / `"no"` |
| Rated | `"1"` through `"5"` |
| Skipped | Negative string (e.g. `"-1"`) |

One vote record per (Person, Option) pair — re-voting overwrites the existing record.

## Revote Mode

Adding `?revote=1` to the vote URL activates revote mode. All options are shown once from the start, regardless of prior votes or skip counts. This lets a user change their mind on every option in a single pass before landing on the results.

## Poll Overview (Without Results)

The `/poll-overview/:pollId` route shows all options without displaying vote counts or trophy badges (`hideResults`). This serves as a hub between voting and results — users can see the options and choose to vote, see results, or start a revote.

## Comments

All poll types support comments. Users can optionally quote another comment when replying, enabling threaded-style discussion without a full thread UI.

## Related

- [Poll](../concepts/poll.md) — the core entity
- [Option](../concepts/option.md) — choices within a poll
- [Vote](../concepts/vote.md) — vote records
- [Appointment Polls](appointment-polls.md) — the Date option type in detail
- [Project](../concepts/project.md) — polls belong to projects
