import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  DateOptionEntry,
  parseDateOptionText,
  serializeDateOption,
} from './date-option.utils';

@Injectable({ providedIn: 'root' })
export class DateOptionFormatService {
  private readonly translateService = inject(TranslateService);

  parse(text: string, id?: string): DateOptionEntry {
    return parseDateOptionText(text, id);
  }

  serialize(entry: DateOptionEntry): string {
    return serializeDateOption(entry);
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
          return `${this.formatDate(p.date!)} – ${this.formatTime(p.startTime)}`;
        }
        return `${this.formatDate(p.date!)} → ${this.formatDate(p.endDate!)}`;
      case 'time':
        return this.formatTime(p.startTime!);
      case 'time-range':
        return `${this.formatTime(p.startTime!)} → ${this.formatTime(p.endTime!)}`;
    }
  }

  subLabelFromEntry(p: DateOptionEntry): string | null {
    if ((p.type === 'weekday' || p.type === 'date') && p.startTime) {
      return this.formatTime(p.startTime);
    }
    if (p.type === 'date-range' && p.startTime) {
      const endDateStr = this.formatDate(p.endDate!);
      return p.endTime
        ? `${endDateStr} – ${this.formatTime(p.endTime)}`
        : endDateStr;
    }
    return null;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString(
      this.translateService.currentLang() ?? undefined,
      { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' },
    );
  }

  private formatTime(date: Date): string {
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
