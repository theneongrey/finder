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
  selector: 'app-vote-card-date-date',
  templateUrl: './vote-card-date-date.component.html',
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
export class VoteCardDateDateComponent {
  private readonly translate = inject(TranslateService);

  entry = input.required<DateOptionEntry>();
  otherDates = input<Set<number>>(new Set());

  readonly selectedDate = computed(() => {
    const d = this.entry().date;
    if (!d) {
      return undefined;
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });

  isOtherDate(date: { year: number; month: number; day: number }): boolean {
    return this.otherDates().has(
      new Date(date.year, date.month, date.day).getTime(),
    );
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
