import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateOptionEntry } from '../../../_shared/utils/date-option.utils';

@Component({
  selector: 'app-vote-card-date-date-range',
  templateUrl: './vote-card-date-date-range.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCardDateDateRangeComponent {
  private readonly translate = inject(TranslateService);

  entry = input.required<DateOptionEntry>();

  formatDate(date: Date): string {
    return date.toLocaleDateString(this.translate.currentLang() ?? undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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
