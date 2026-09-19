import { OptionType } from '@common/models/option-type.model';

export type DateOptionType =
    | 'weekday'
    | 'date'
    | 'date-range'
    | 'time'
    | 'time-range';

export interface DateOptionEntry {
    id?: string;
    type: DateOptionType;
    weekday?: number;
    date?: Date;
    endDate?: Date;
    startTime?: Date;
    endTime?: Date;
}

/**
 * The date sub-type is now a top-level property of the poll: each granular
 * `OptionType` maps 1:1 to a `DateOptionType`. These helpers bridge the poll's
 * `OptionType` and the entry-level `DateOptionType` used by the option editors.
 */
const OPTION_TYPE_TO_DATE_TYPE: Partial<Record<OptionType, DateOptionType>> = {
    [OptionType.Weekday]: 'weekday',
    [OptionType.WeekdayWithTime]: 'weekday',
    [OptionType.Date]: 'date',
    [OptionType.DateWithTime]: 'date',
    [OptionType.DateRange]: 'date-range',
    [OptionType.DateRangeWithTime]: 'date-range',
    [OptionType.Time]: 'time',
    [OptionType.TimeRange]: 'time-range',
};

// Each date sub-type that can carry a time-of-day has an all-day variant and a
// with-time variant; `time`/`time-range` are inherently time-based.
const DATE_TYPE_TO_OPTION_TYPE: Record<
    DateOptionType,
    { withoutTime: OptionType; withTime: OptionType }
> = {
    weekday: {
        withoutTime: OptionType.Weekday,
        withTime: OptionType.WeekdayWithTime,
    },
    date: { withoutTime: OptionType.Date, withTime: OptionType.DateWithTime },
    'date-range': {
        withoutTime: OptionType.DateRange,
        withTime: OptionType.DateRangeWithTime,
    },
    time: { withoutTime: OptionType.Time, withTime: OptionType.Time },
    'time-range': {
        withoutTime: OptionType.TimeRange,
        withTime: OptionType.TimeRange,
    },
};

const OPTION_TYPES_WITH_TIME: ReadonlySet<OptionType> = new Set([
    OptionType.DateWithTime,
    OptionType.WeekdayWithTime,
    OptionType.DateRangeWithTime,
    OptionType.Time,
    OptionType.TimeRange,
]);

export function optionTypeToDateType(
    optionType: OptionType | undefined,
): DateOptionType | undefined {
    return optionType === undefined
        ? undefined
        : OPTION_TYPE_TO_DATE_TYPE[optionType];
}

export function dateTypeToOptionType(
    dateType: DateOptionType,
    hasTime = false,
): OptionType {
    const variants = DATE_TYPE_TO_OPTION_TYPE[dateType];
    return hasTime ? variants.withTime : variants.withoutTime;
}

/** Whether a poll's concrete OptionType carries a time-of-day per option. */
export function optionTypeHasTime(optionType: OptionType | undefined): boolean {
    return optionType === undefined
        ? false
        : OPTION_TYPES_WITH_TIME.has(optionType);
}

export function isDateOptionType(optionType: OptionType | undefined): boolean {
    return optionTypeToDateType(optionType) !== undefined;
}
