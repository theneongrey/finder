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

## URL Preview (OptionMeta)

If a URL is provided when creating an option, the backend fetches its OpenGraph metadata and stores it as `OptionMeta`:

- **Extracted fields**: Title, Description, ImageUrl, SiteName
- **Fallback chain**: `og:` properties → `twitter:` properties → standard `<meta>` tags
- **Timeout**: 5 seconds per URL fetch
- **Relative image URLs** are resolved to absolute before storing

OptionMeta shares the option's ID (1:1 relationship). If no URL is provided, no OptionMeta record is created.

## Date Option Encoding

For [Appointment Polls](../features/appointment-polls.md) (`OptionType = Date`), the `Text` field encodes a date/time value using a semicolon-delimited format rather than free text. See [Appointment Polls](../features/appointment-polls.md) for the full encoding specification.

The backend's `SlugHelper` extracts the human-readable part of a date option's slug by taking the segment before the first `;` in the Text field.

## Related

- [Poll](poll.md) — the poll this option belongs to
- [Vote](vote.md) — user selections on this option
- [Appointment Polls](../features/appointment-polls.md) — date/time encoding format for Date poll options
- [Backend](../architecture/backend.md) — PreviewService that fetches URL metadata
