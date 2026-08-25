import { Injectable } from '@angular/core';
import { DateOptionEntry, DateOptionType } from '../models/date-option.model';

@Injectable({ providedIn: 'root' })
export class AppointmentTypeConversionService {
  convert(
    entries: DateOptionEntry[],
    from: DateOptionType,
    to: DateOptionType,
  ): DateOptionEntry[] {
    if (from === to) {
      return entries;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const converted = entries.map((entry) =>
      this.convertEntry(entry, from, to, today),
    );
    const nonEmpty = converted.filter((e) => this.isNonEmpty(e));
    return this.removeDuplicates(nonEmpty, to);
  }

  private convertEntry(
    entry: DateOptionEntry,
    from: DateOptionType,
    to: DateOptionType,
    today: Date,
  ): DateOptionEntry {
    switch (to) {
      case 'weekday':
        return {
          type: 'weekday',
          weekday: this.extractWeekday(entry, from, today),
          startTime: entry.startTime,
        };

      case 'date':
        return {
          type: 'date',
          date: this.extractStartDate(entry, from, today),
          startTime: entry.startTime,
        };

      case 'date-range':
        return {
          type: 'date-range',
          date: this.extractStartDate(entry, from, today),
          endDate:
            from === 'date-range'
              ? entry.endDate
              : from === 'time-range'
                ? new Date(today)
                : undefined,
          startTime: entry.startTime,
          endTime:
            from === 'date-range' || from === 'time-range'
              ? entry.endTime
              : undefined,
        };

      case 'time':
        return {
          type: 'time',
          startTime: entry.startTime,
        };

      case 'time-range':
        return {
          type: 'time-range',
          startTime: entry.startTime,
          endTime: from === 'time-range' ? entry.endTime : undefined,
        };
    }
  }

  private extractWeekday(
    entry: DateOptionEntry,
    from: DateOptionType,
    today: Date,
  ): number | undefined {
    switch (from) {
      case 'weekday':
        return entry.weekday;
      case 'date':
        return entry.date?.getDay();
      case 'date-range':
        return entry.date?.getDay();
      case 'time':
        return today.getDay();
      case 'time-range':
        return today.getDay();
    }
  }

  private extractStartDate(
    entry: DateOptionEntry,
    from: DateOptionType,
    today: Date,
  ): Date | undefined {
    switch (from) {
      case 'weekday':
        return entry.weekday !== undefined
          ? this.nextWeekdayDate(entry.weekday, today)
          : undefined;
      case 'date':
        return entry.date;
      case 'date-range':
        return entry.date;
      case 'time':
        return new Date(today);
      case 'time-range':
        return new Date(today);
    }
  }

  private nextWeekdayDate(weekday: number, today: Date): Date {
    const daysUntil = (weekday - today.getDay() + 7) % 7;
    const result = new Date(today);
    result.setDate(today.getDate() + daysUntil);
    return result;
  }

  private isNonEmpty(entry: DateOptionEntry): boolean {
    switch (entry.type) {
      case 'weekday':
        return entry.weekday !== undefined;
      case 'date':
        return true;
      case 'date-range':
        return true;
      case 'time':
        return entry.startTime !== undefined;
      case 'time-range':
        return entry.startTime !== undefined;
    }
  }

  private removeDuplicates(
    entries: DateOptionEntry[],
    type: DateOptionType,
  ): DateOptionEntry[] {
    const seen = new Set<string>();
    return entries.filter((entry) => {
      const key = this.entryKey(entry, type);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private entryKey(entry: DateOptionEntry, type: DateOptionType): string {
    switch (type) {
      case 'weekday':
        return `${entry.weekday}`;
      case 'date':
        return `${entry.date?.getTime() ?? 'none'}`;
      case 'date-range':
        return `${entry.date?.getTime() ?? 'none'}-${entry.endDate?.getTime() ?? 'none'}`;
      case 'time': {
        const t = entry.startTime;
        return t ? `${t.getHours()}:${t.getMinutes()}` : 'none';
      }
      case 'time-range': {
        const s = entry.startTime;
        const e = entry.endTime;
        return `${s ? `${s.getHours()}:${s.getMinutes()}` : 'none'}-${e ? `${e.getHours()}:${e.getMinutes()}` : 'none'}`;
      }
    }
  }
}
