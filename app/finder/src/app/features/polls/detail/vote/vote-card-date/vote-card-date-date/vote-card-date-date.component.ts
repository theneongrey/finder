import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HlmCalendar } from '@spartan-ng/helm/calendar';
import { DateOptionEntry } from '../../../../_shared/models/date-option.model';

@Component({
  selector: 'app-vote-card-date-date',
  templateUrl: './vote-card-date-date.component.html',
  styles: [':host { display: contents; }'],
  imports: [HlmCalendar],
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

  readonly otherDatesArray = computed(() =>
    Array.from(this.otherDates()).map((ts) => new Date(ts)),
  );

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
