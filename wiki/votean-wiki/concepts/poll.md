---
type: Concept
title: Poll
description: The central voting construct — holds options, a type, and comments; belongs to a Project
tags: [domain, poll, voting]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: Poll entity
    resource: api/Finder/Business/Project/Entities/Poll.cs
  - title: PollDetail model
    resource: app/finder/src/app/features/project/_shared/models/project-detail.model.ts
---

# Poll

A Poll is the central voting unit. It belongs to a [Project](project.md) and contains one or more [Option](option.md) entries that participants vote on.

## Types

Three poll types exist, controlled by the `OptionType` discriminator:

| Type | Behaviour |
|------|-----------|
| **YesNo** | Binary yes/no vote per option |
| **Rating** | 1–5 numeric rating per option |
| **Date** | Appointment scheduling — options encode date/time values |

The type is set at creation and cannot be changed without re-creating the poll.

## Standalone Polls

A poll can exist without a parent project (`IsStandalone = true` on the containing Project record). Standalone polls are accessible from the overview's Polls tab and can be shared directly via a public link without exposing a project detail page.

## Slug IDs

Poll IDs follow the project-wide slug format: `{human-readable-name}-{8-char-hex}`. The backend extracts the raw ID by taking the last `-`-delimited segment. URLs use the full slug for readability.

## Related

- [Option](option.md) — choices within this poll
- [Vote](vote.md) — user selections on options
- [Project](project.md) — container that groups polls
- [Polling](../features/polling.md) — full feature description including voting UX
- [Appointment Polls](../features/appointment-polls.md) — the Date type in detail
