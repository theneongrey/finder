import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { DatePicker } from 'primeng/datepicker';
import { DateOptionEntry } from '../../../../_shared/utils/date-option.utils';

@Component({
  selector: 'app-vote-card-date-date-range',
  templateUrl: './vote-card-date-date-range.component.html',
  styles: [
    ':host { display: contents; }',
    `
      :host ::ng-deep .p-datepicker-prev-button,
      :host ::ng-deep .p-datepicker-next-button {
        display: none !important;
      }
    `,
  ],
  imports: [DatePicker, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCardDateDateRangeComponent {
  private readonly translate = inject(TranslateService);

  entry = input.required<DateOptionEntry>();

  private readonly startDate = computed(() => {
    const d = this.entry().date;
    return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : undefined;
  });

  private readonly endDate = computed(() => {
    const d = this.entry().endDate;
    return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : undefined;
  });

  readonly isSameMonth = computed(() => {
    const s = this.startDate();
    const e = this.endDate();

    return !!(
      s &&
      e &&
      s.getFullYear() === e.getFullYear() &&
      s.getMonth() === e.getMonth()
    );
  });

  readonly rangeValue = computed(() => {
    const s = this.startDate();
    const e = this.endDate();
    return s && e ? [s, e] : undefined;
  });

  isInRange(date: { year: number; month: number; day: number }): boolean {
    const d = new Date(date.year, date.month, date.day).getTime();
    const start = this.startDate()?.getTime();
    const end = this.endDate()?.getTime();
    if (start === undefined || end === undefined) {
      return false;
    }
    return d > start && d < end;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString(this.translate.currentLang() ?? undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatTimeOnly(date: Date): string {
    return date.toLocaleTimeString(this.translate.currentLang() ?? undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
