import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateOptionEntry } from '../../../_shared/utils/date-option.utils';

@Component({
  selector: 'app-vote-card-date-time',
  templateUrl: './vote-card-date-time.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCardDateTimeComponent {
  private readonly translate = inject(TranslateService);

  entry = input.required<DateOptionEntry>();

  formatTimeOnly(date: Date): string {
    return date.toLocaleTimeString(this.translate.currentLang() ?? undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
