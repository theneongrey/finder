import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  parseDateOptionText,
  DateOptionEntry,
} from '../../../_shared/utils/date-option.utils';

@Component({
  selector: 'app-vote-card-date',
  templateUrl: './vote-card-date.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCardDateComponent {
  private readonly translate = inject(TranslateService);

  text = input('');

  parsed = computed<DateOptionEntry>(() => parseDateOptionText(this.text()));

  formatDate(date: Date): string {
    return date.toLocaleDateString(this.translate.currentLang() ?? undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString(this.translate.currentLang() ?? undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTimeOnly(date: Date): string {
    return date.toLocaleTimeString(this.translate.currentLang() ?? undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  weekdayName(day: number): string {
    return this.translate.instant(`project.pollInput.date.weekdays.${day}`);
  }
}
