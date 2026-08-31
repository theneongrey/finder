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
