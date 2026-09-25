---
type: Feature
title: Polling
description: Creating and running polls — three option types, swipe-based voting, skip logic, revote mode
tags: [poll, voting, feature, ux]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-03-25
sources:
  - title: PollDetailComponent (results = detail page)
    resource: app/finder/src/app/features/polls/detail/poll-detail/poll-detail.component.ts
  - title: PollVoteComponent (voting overlay)
    resource: app/finder/src/app/features/polls/detail/vote/
  - title: polls feature routes
    resource: app/finder/src/app/features/polls/polls.routes.ts
  - title: PollDetailStore
    resource: app/finder/src/app/features/polls/_shared/data/poll-detail.store.ts
---

# Polling

Polls are the primary decision-making unit in Votean. Each poll belongs to a [Project](../concepts/project.md) (or is standalone) and contains one or more [Option](../concepts/option.md) entries that users vote on.

## Poll Types (OptionType)

| Value | Name | Description |
|-------|------|-------------|
| 0 | YesNo | Each option gets a yes or no response |
| 1 | Rating | Each option is rated 1–5 |
| 2 | Date | Appointment scheduling — options encode date/time values (see [Appointment Polls](appointment-polls.md)) |

The `OptionType` enum was later expanded (migration `ExpandOptionTypeAndStripDatePrefix`) with
additional date sub-type variants (date-only vs. date+time). See
[Appointment Polls](appointment-polls.md) for the full set and encoding.

## The Poll Detail Page

A poll opens at a single route — `/polls/:id/:pollId` — where **results *is* the detail
page**. Options render as a grid of cards (text and date variants), with a poll header, a
results toolbar, and a share bar. There is no longer a separate results-free overview or a
standalone vote route; the 2026 rebuild collapsed all three into this one page. See the
[Poll Detail Page Rebuild](../architecture/poll-detail-rebuild.md) decision record for the
before/after and routing details.

Managing actions (End poll, Share) live behind a kebab (overflow) menu in the results
toolbar. The detail column uses container queries (`@container/detail`) so it switches to a
compact layout based on its own width — important because the comments sidebar narrows it
well below the viewport width.

## Voting UX

Voting happens in an **animated overlay** on top of the detail page (`PollVoteComponent`) —
not on its own route. Entry points (the results toolbar, per-option vote/revote buttons, the
public-poll flow, and in-app notifications) open the overlay; the URL stays
`/polls/:id/:pollId` throughout. The overlay:

- shows one option at a time as a card over a translucent, blurred veil (the detail page
  stays visible, dimmed);
- tracks the current option internally and takes `startOptionId` / `revote` inputs;
- offers **Yes / No** with **Skip** sitting between them (the old reject/maybe button was
  dropped);
- closes via the X button, `Escape`, or click-outside, emitting `finished` / `dismissed`.

### Skip Logic

Skipped options are not ignored permanently. The frontend re-shows each skipped option up to
**2 times** before considering it done. Once all options have been voted on or skipped
twice, the overlay closes back to the detail page.

Skip state is stored in the session (not persisted to the server). A page refresh resets the
skip counter.

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

Opening the voting overlay with `revote` set activates revote mode. All options are shown
once from the start, regardless of prior votes or skip counts. This lets a user change their
mind on every option in a single pass before returning to the detail page.

## Comments

All poll types support comments. Users can optionally quote another comment when replying, enabling threaded-style discussion without a full thread UI.

## Related

- [Poll](../concepts/poll.md) — the core entity
- [Option](../concepts/option.md) — choices within a poll
- [Vote](../concepts/vote.md) — vote records
- [Appointment Polls](appointment-polls.md) — the Date option type in detail
- [Poll Detail Page Rebuild](../architecture/poll-detail-rebuild.md) — the results-as-detail + voting-overlay rework
- [Project](../concepts/project.md) — polls belong to projects
