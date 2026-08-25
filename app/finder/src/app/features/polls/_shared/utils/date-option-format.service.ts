import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateOptionEntry } from '../models/date-option.model';

@Injectable({ providedIn: 'root' })
export class DateOptionFormatService {
  private readonly translateService = inject(TranslateService);

  parse(text: string, id?: string): DateOptionEntry {
    return parseDateOptionText(text, id);
  }

  serialize(entry: DateOptionEntry): string {
    return serializeDateOption(entry);
  }

  isValid(entry: DateOptionEntry): boolean {
    switch (entry.type) {
      case 'weekday':
        return (
          entry.weekday !== undefined &&
          entry.weekday >= 0 &&
          entry.weekday <= 6
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

  nextFullHour(): Date {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  }

  formatTimeInput(d: Date): string {
    return formatHHMM(d);
  }

  parseTimeInput(value: string): Date | undefined {
    if (!value) {
      return undefined;
    }
    const [h, m] = value.split(':').map(Number);
    const d = new Date(0);
    d.setHours(h, m, 0, 0);
    return d;
  }

  formatLabel(text: string): string {
    return this.labelFromEntry(parseDateOptionText(text));
  }

  formatSubLabel(text: string): string | null {
    return this.subLabelFromEntry(parseDateOptionText(text));
  }

  labelFromEntry(p: DateOptionEntry): string {
    switch (p.type) {
      case 'weekday':
        return this.weekdayName(p.weekday!);
      case 'date':
        return this.formatDate(p.date!);
      case 'date-range':
        if (p.startTime) {
          return `${this.formatDate(p.date!)} – ${this.formatLocaleTime(p.startTime)}`;
        }
        return `${this.formatDate(p.date!)} → ${this.formatDate(p.endDate!)}`;
      case 'time':
        return this.formatLocaleTime(p.startTime!);
      case 'time-range':
        return `${this.formatLocaleTime(p.startTime!)} → ${this.formatLocaleTime(p.endTime!)}`;
    }
  }

  subLabelFromEntry(p: DateOptionEntry): string | null {
    if ((p.type === 'weekday' || p.type === 'date') && p.startTime) {
      return this.formatLocaleTime(p.startTime);
    }
    if (p.type === 'date-range' && p.startTime) {
      const endDateStr = this.formatDate(p.endDate!);
      return p.endTime
        ? `${endDateStr} – ${this.formatLocaleTime(p.endTime)}`
        : endDateStr;
    }
    return null;
  }

  formatCloseDate(dateString: string): string {
    const d = new Date(dateString);
    return d.toLocaleString(this.translateService.currentLang() ?? undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString(
      this.translateService.currentLang() ?? undefined,
      { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' },
    );
  }

  private formatLocaleTime(date: Date): string {
    return date.toLocaleTimeString(
      this.translateService.currentLang() ?? undefined,
      { hour: '2-digit', minute: '2-digit' },
    );
  }

  private weekdayName(day: number): string {
    return this.translateService.instant(
      `project.pollInput.date.weekdays.${day}`,
    );
  }
}

function formatHHMM(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function parseTimeString(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(0);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function parseDateOptionText(text: string, id?: string): DateOptionEntry {
  const parts = text.split(';');
  const type = parts[0] as DateOptionEntry['type'];

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

function serializeDateOption(entry: DateOptionEntry): string {
  const time = entry.startTime ? ';' + formatHHMM(entry.startTime) : '';
  switch (entry.type) {
    case 'weekday':
      return `weekday;${entry.weekday}${time}`;
    case 'date':
      return `date;${entry.date!.getTime()}${time}`;
    case 'date-range': {
      const endTime = entry.endTime ? ';' + formatHHMM(entry.endTime) : '';
      return `date-range;${entry.date!.getTime()};${entry.endDate!.getTime()}${time}${endTime}`;
    }
    case 'time':
      return `time;${formatHHMM(entry.startTime!)}`;
    case 'time-range':
      return `time-range;${formatHHMM(entry.startTime!)};${formatHHMM(entry.endTime!)}`;
  }
}
