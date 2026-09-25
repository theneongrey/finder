---
type: Architecture
title: Poll Detail Page Rebuild
description: The 2026 UI rework that made results the single poll detail page, turned voting into an animated overlay, and collapsed the separate vote / poll-overview / results routes
tags: [frontend, polls, ux, routing, refactor, decision-record]
status: stable
generated:
  actor: claude-opus-4-8
  date: 2026-09-25
stale_after: 2027-03-25
sources:
  - title: "PR #396 — Redesign result page as option card grid"
    resource: https://github.com/theneongrey/finder/pull/396
  - title: "PR #409 — voting as an animated overlay on the detail page"
    resource: https://github.com/theneongrey/finder/pull/409
  - title: "PR #422 — clearable inputs + width-based detail layout"
    resource: https://github.com/theneongrey/finder/pull/422
  - title: "PR #426 — poll detail overflow menu for close & share"
    resource: https://github.com/theneongrey/finder/pull/426
  - title: "PR #351 — consolidate title-bar in polls-shell, relocate public-poll"
    resource: https://github.com/theneongrey/finder/pull/351
  - title: polls feature routes
    resource: app/finder/src/app/features/polls/polls.routes.ts
---

# Poll Detail Page Rebuild

Over 2026 the poll experience was rebuilt around a **single detail page**. What used to be
three separate full-page routes — voting, a results-free option overview, and results — is
now one page (**results *is* the detail page**), with voting layered on top of it as an
animated overlay. This page is the decision record for that rework; see
[Polling](../features/polling.md) for the current user-facing behaviour.

## What changed

### Before

Polls lived under `/project/detail/:projectId` with three sibling routes:

- `/vote/:pollId/:optionId?` — swipe-based, one option per card, navigating between
  per-option URLs and finally routing to results
- `/poll-overview/:pollId` — options shown without vote counts (a hub between voting and
  results)
- `/results/:pollId` — vote results with counts

### After

A single detail route renders everything:

```
/polls/:id/:pollId        →  PollDetailShellComponent  →  PollDetailComponent
```

- **Results is the detail page.** `ResultsComponent` was renamed to `PollDetailComponent`
  (folder `detail/results/` → `detail/poll-detail/`); it remains a smart component. The
  shell renders it directly instead of via a nested `<router-outlet>` (PR #409).
- **The separate `/vote` and `/poll-overview` routes were removed.** Voting no longer owns
  a URL; the URL stays `/polls/:id/:pollId` throughout.
- **Results is an option-card grid.** Each option renders as a card (text and date
  variants) sized by content area rather than viewport, with a results skeleton loading
  state, a redesigned poll header, a results toolbar and a share bar (PR #396).

## Voting overlay

`PollVoteComponent` (folder `features/polls/detail/vote/`) is now a self-contained overlay
rather than a route (PR #409):

- Tracks the current option **internally** — no route param. Takes `startOptionId` and
  `revote` inputs; emits `finished` / `dismissed`.
- Renders a full-screen, centered vote card over a translucent, blurred veil; the detail
  page stays visible but dimmed. Opens/closes with a micro animation.
- Dismissable via the X button, `Escape`, or click-outside.
- The **reject / maybe button was dropped**; skip sits between Yes and No.

Entry points (results toolbar, per-option vote/revote buttons, the public-poll flow, and
in-app notifications) all open the overlay on the detail route instead of navigating to a
vote URL.

## Supporting changes

- **Overflow menu (PR #426).** The standalone *End poll* button in the results toolbar
  became a kebab (3-dot) overflow menu holding *End poll* (only when the user can manage an
  open poll) and *Share* (always available while open). The title-bar share action was
  removed. `ds-menu` gained an optional `separatorBefore` on `MenuItem`.
- **Container-query layout (PR #422).** The detail content column is a
  `@container/detail`; the toolbar, header, padding, option-card hover-reveal and empty/
  share bars switch to their compact layout at `@min-[900px]/detail:` — based on the
  column's own width, not the viewport, so the 380px comments sidebar can't cause overflow.
  A couple of rules stay viewport-based on purpose (sticky offset, the "show comments"
  toggle).
- **Single-step add-poll flow (PR #396, #424).** The add-poll wizard became a single step
  with deferred sharing, and the auto-close ("automatisch schließen") card was removed from
  creation — new polls are created without an auto-close date, though the shared
  `poll-close-settings` component still exists for editing.
- **Shell consolidation (PR #351).** `<app-title-bar>` moved up into `polls-shell` so it
  renders exactly once, and the `public-poll` feature was relocated to
  `features/public-poll/` because its `/p/:projectId` route lives at the app level, outside
  the `/polls` tree.

## Current route map

The full app route table lives in [Frontend Architecture](frontend.md#routing). The poll
subtree (all under the protected `/polls` shell) is:

| Route | Component | Purpose |
|---|---|---|
| `/polls` | `PollsOverviewComponent` | overview / list |
| `/polls/add` | `AddPollComponent` | single-step create wizard |
| `/polls/:id/:pollId` | `PollDetailShellComponent` → `PollDetailComponent` | detail = results, with voting overlay |

## E2E impact

The Playwright suite had drifted across the successive redesigns. PR #409 rewrote the
create-poll flow and `beforeAll` setups (new `createStandalonePoll` / `addTextOption`
helpers), the detail-page assertions and the vote-flow tests (overlay open + dismiss), and
switched `login()` to **API-based auth** (2 requests instead of a 5-page UI flow) — cutting
the suite from ~25 min to ~6 min and removing login flakiness. See
[Testing](../guides/testing.md).

## Related

- [Polling](../features/polling.md) — current voting UX, revote, comments
- [Frontend Architecture](frontend.md) — routes, stores, component layers
- [Appointment Polls](../features/appointment-polls.md) — the date option cards in the grid
- [Public Sharing](../features/public-sharing.md) — the relocated public-poll flow
