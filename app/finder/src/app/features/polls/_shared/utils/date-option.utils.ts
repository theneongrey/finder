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

export function parseDateOptionText(
  text: string,
  id?: string,
): DateOptionEntry {
  const parts = text.split(';');
  const type = parts[0] as DateOptionType;

  switch (type) {
    case 'weekday':
      return {
        id,
        type: 'weekday',
        weekday: parseInt(parts[1]),
        startTime: parts[2] ? parseTimeString(parts[2]) : undefined,
      };
    case 'date':
      return {
        id,
        type: 'date',
        date: new Date(parseInt(parts[1])),
        startTime: parts[2] ? parseTimeString(parts[2]) : undefined,
      };
    case 'date-range':
      return {
        id,
        type: 'date-range',
        date: new Date(parseInt(parts[1])),
        endDate: new Date(parseInt(parts[2])),
        startTime: parts[3] ? parseTimeString(parts[3]) : undefined,
        endTime: parts[4] ? parseTimeString(parts[4]) : undefined,
      };
    case 'time':
      return { id, type: 'time', startTime: parseTimeString(parts[1]) };
    case 'time-range':
      return {
        id,
        type: 'time-range',
        startTime: parseTimeString(parts[1]),
        endTime: parseTimeString(parts[2]),
      };
    default: {
      const ts = parseInt(parts[0]);
      return { id, type: 'date', date: isNaN(ts) ? undefined : new Date(ts) };
    }
  }
}

export function serializeDateOption(entry: DateOptionEntry): string {
  const time = entry.startTime ? ';' + formatTime(entry.startTime) : '';
  switch (entry.type) {
    case 'weekday':
      return `weekday;${entry.weekday}${time}`;
    case 'date':
      return `date;${entry.date!.getTime()}${time}`;
    case 'date-range': {
      const endTime = entry.endTime ? ';' + formatTime(entry.endTime) : '';
      return `date-range;${entry.date!.getTime()};${entry.endDate!.getTime()}${time}${endTime}`;
    }
    case 'time':
      return `time;${formatTime(entry.startTime!)}`;
    case 'time-range':
      return `time-range;${formatTime(entry.startTime!)};${formatTime(entry.endTime!)}`;
  }
}

export function isDateOptionEntryValid(entry: DateOptionEntry): boolean {
  switch (entry.type) {
    case 'weekday':
      return (
        entry.weekday !== undefined && entry.weekday >= 0 && entry.weekday <= 6
      );
    case 'date':
      return entry.date !== undefined;
    case 'date-range':
      return (
        entry.date !== undefined &&
        entry.endDate !== undefined &&
        entry.endDate >= entry.date
      );
    case 'time':
      return entry.startTime !== undefined;
    case 'time-range':
      return entry.startTime !== undefined && entry.endTime !== undefined;
  }
}

export function nextFullHour(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

export function parseTimeString(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(0);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function formatTime(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function parseTimeInput(value: string): Date | undefined {
  if (!value) { return undefined; }
  const [h, m] = value.split(':').map(Number);
  const d = new Date(0);
  d.setHours(h, m, 0, 0);
  return d;
}
