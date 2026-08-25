import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateOptionEntry } from '../../../../_shared/models/date-option.model';

@Component({
  selector: 'app-vote-card-date-weekday',
  templateUrl: './vote-card-date-weekday.component.html',
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCardDateWeekdayComponent {
  private readonly translate = inject(TranslateService);

  entry = input.required<DateOptionEntry>();
  otherWeekdays = input.required<Set<number>>();

  readonly weekdays = [1, 2, 3, 4, 5, 6, 0];

  weekdayName(day: number): string {
    return this.translate.instant(`project.pollInput.date.weekdays.${day}`);
  }

  weekdayShortName(day: number): string {
    return this.translate.instant(
      `project.pollInput.date.weekdaysShort.${day}`,
    );
  }

  formatTimeOnly(date: Date): string {
    return date.toLocaleTimeString(this.translate.currentLang() ?? undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
