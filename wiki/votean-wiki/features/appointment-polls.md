---
type: Feature
title: Appointment Polls
description: Date/time scheduling polls — five sub-types encoded as semicolon-delimited strings in Option.Text
tags: [appointment, scheduling, poll, date]
status: stable
generated:
  actor: claude-sonnet-4-6
  date: 2026-08-03
stale_after: 2027-02-03
sources:
  - title: date-option.utils.ts
    resource: app/finder/src/app/features/project/_shared/utils/date-option.utils.ts
---

# Appointment Polls

Appointment polls are [polls](../concepts/poll.md) with `OptionType = Date`. Instead of free-text choices, each option encodes a date or time value using a compact semicolon-delimited format stored in `Option.Text`.

## Five Sub-types

| Sub-type | Meaning | Format |
|----------|---------|--------|
| `weekday` | A recurring weekday, optionally with a time | `weekday;<0–6>[;<HH:MM>]` |
| `date` | A specific date, optionally with a time | `date;<unix-timestamp>[;<HH:MM>]` |
| `date-range` | A date span, optionally with start/end times | `date-range;<startTs>;<endTs>[;<HH:MM>[;<HH:MM>]]` |
| `time` | A time of day with no date | `time;<HH:MM>` |
| `time-range` | A time span | `time-range;<HH:MM>;<HH:MM>` |

Weekdays follow JavaScript convention: `0` = Sunday, `6` = Saturday.

## Encoding Examples

```
weekday;3             → Wednesday (no time)
weekday;3;14:30       → Wednesday at 14:30
date;1704067200       → 2024-01-01 (no time)
date;1704067200;10:00 → 2024-01-01 at 10:00
date-range;1704067200;1704153600          → 2024-01-01 to 2024-01-02
date-range;1704067200;1704153600;09:00;17:00 → same range, 09:00–17:00
time;14:30            → 14:30
time-range;09:00;17:00 → 09:00–17:00
```

## Utility Functions

All encoding/decoding is centralised in `date-option.utils.ts`:

| Function | Purpose |
|----------|---------|
| `parseDateOptionText(text, id?)` | Decode an `Option.Text` string into a `DateOptionEntry` object |
| `serializeDateOption(entry)` | Encode a `DateOptionEntry` back to the storage string |
| `isDateOptionEntryValid(entry)` | Validate an entry (date ordering, weekday in 0–6, required fields) |
| `nextFullHour()` | Returns the next full hour as a `Date` (used as default when adding a time) |
| `parseTimeString(str)` | Parse `"HH:MM"` → `Date` |
| `formatTime(d)` | Format `Date` → `"HH:MM"` |

The `DateOptionEntry` interface used by these functions:

```typescript
interface DateOptionEntry {
  id?: string
  type: 'weekday' | 'date' | 'date-range' | 'time' | 'time-range'
  weekday?: number     // 0–6
  date?: Date          // start date
  endDate?: Date       // end date (date-range only)
  startTime?: Date     // only hours/minutes used
  endTime?: Date       // end time (range types)
}
```

## Slug Names

The backend extracts a human-readable slug from appointment options by taking the part before the first `;` in `Option.Text`. For example, `"date;1704067200;10:00"` yields slug segment `"date"`.

## Related

- [Poll](../concepts/poll.md) — parent concept; appointment polls use OptionType = Date
- [Option](../concepts/option.md) — where the encoded text is stored
- [Polling](polling.md) — voting UX that works across all poll types
