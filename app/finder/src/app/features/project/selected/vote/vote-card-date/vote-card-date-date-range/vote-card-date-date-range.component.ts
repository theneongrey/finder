import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HlmCalendarRange } from '@spartan-ng/helm/calendar';
import { DateOptionEntry } from '../../../../_shared/utils/date-option.utils';

@Component({
  selector: 'app-vote-card-date-date-range',
  templateUrl: './vote-card-date-date-range.component.html',
  styles: [':host { display: contents; }'],
  imports: [HlmCalendarRange],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCardDateDateRangeComponent {
  private readonly translate = inject(TranslateService);

  entry = input.required<DateOptionEntry>();

  readonly startDate = computed(() => {
    const d = this.entry().date;
    return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : undefined;
  });

  readonly endDate = computed(() => {
    const d = this.entry().endDate;
    return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : undefined;
  });

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
