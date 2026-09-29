---
type: Concept
title: Option
description: A choice within a poll — holds text, an optional image/URL preview, and vote records
tags: [domain, option, voting]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: Option entity
    resource: api/Finder/Business/Project/Entities/Option.cs
  - title: OptionMeta entity
    resource: api/Finder/Business/Project/Entities/OptionMeta.cs
  - title: PreviewService
    resource: api/Finder/Business/Preview/Services/PreviewService.cs
---

# Option

An Option is one choice within a [Poll](poll.md). Users cast [Vote](vote.md) records against options. Each option has a text label, an optional description, and optionally a rich URL preview.

## Creator

Every option has a **required `Creator`** (a `Person`, via `CreatorId`), tracking who added
it. New options are attributed to the current user at creation time
(`ProjectService.AddOptionToPoll`); existing rows were backfilled from each option's project
creator (Option → Poll → Project.Creator) in the `AddOptionCreator` migration. The creator's
name and picture flow to the frontend on each poll option (`PollResponseOptionCreator`) so the
voting and result views can attribute options. Added in PR #393.

## URL Preview (OptionMeta)

If a URL is entered for an option, the frontend fetches a preview from `GET /api/preview` and
sends it along as `OptionMeta` when the option is saved:

- **Fields**: Title, Description, ImageUrl, SiteName — each may be empty; the preview is partial
  when a site does not provide (or blocks) some of them
- **How it is built**: Open Graph / Twitter / JSON-LD metadata, image guessing, a headless-browser
  fallback and a URL-slug fallback — see [Link Preview](../architecture/link-preview.md)

OptionMeta shares the option's ID (1:1 relationship). If no URL is provided, no OptionMeta record is created.

## Date Option Encoding

For [Appointment Polls](../features/appointment-polls.md) (`OptionType = Date`), the `Text` field encodes a date/time value using a semicolon-delimited format rather than free text. See [Appointment Polls](../features/appointment-polls.md) for the full encoding specification.

The backend's `SlugHelper` extracts the human-readable part of a date option's slug by taking the segment before the first `;` in the Text field.

## Related

- [Poll](poll.md) — the poll this option belongs to
- [Vote](vote.md) — user selections on this option
- [Appointment Polls](../features/appointment-polls.md) — date/time encoding format for Date poll options
- [Link Preview](../architecture/link-preview.md) — how the URL preview is built
