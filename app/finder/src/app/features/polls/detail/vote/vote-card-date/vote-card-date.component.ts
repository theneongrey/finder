import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DateOptionEntry } from '../../../_shared/utils/date-option.utils';
import { DateOptionFormatService } from '../../../_shared/utils/date-option-format.service';
import { VoteCardDateWeekdayComponent } from './vote-card-date-weekday/vote-card-date-weekday.component';
import { VoteCardDateDateComponent } from './vote-card-date-date/vote-card-date-date.component';
import { VoteCardDateDateRangeComponent } from './vote-card-date-date-range/vote-card-date-date-range.component';
import { VoteCardDateTimeComponent } from './vote-card-date-time/vote-card-date-time.component';
import { VoteCardDateTimeRangeComponent } from './vote-card-date-time-range/vote-card-date-time-range.component';

@Component({
  selector: 'app-vote-card-date',
  templateUrl: './vote-card-date.component.html',
  styles: [':host { display: contents; }'],
  imports: [
    VoteCardDateWeekdayComponent,
    VoteCardDateDateComponent,
    VoteCardDateDateRangeComponent,
    VoteCardDateTimeComponent,
    VoteCardDateTimeRangeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCardDateComponent {
  private readonly dateOptionFormat = inject(DateOptionFormatService);

  text = input('');
  allOptionTexts = input<string[]>([]);

  parsed = computed<DateOptionEntry>(() => this.dateOptionFormat.parse(this.text()));

  otherWeekdays = computed<Set<number>>(() => {
    const current = this.parsed().weekday;
    const days = new Set<number>();
    for (const t of this.allOptionTexts()) {
      const entry = this.dateOptionFormat.parse(t);
      if (entry.type === 'weekday' && entry.weekday !== undefined && entry.weekday !== current) {
        days.add(entry.weekday);
      }
    }
    return days;
  });

  otherDates = computed<Set<number>>(() => {
    const cur = this.parsed().date;
    const curTs = cur
      ? new Date(cur.getFullYear(), cur.getMonth(), cur.getDate()).getTime()
      : undefined;
    const days = new Set<number>();
    for (const t of this.allOptionTexts()) {
      const entry = this.dateOptionFormat.parse(t);
      if (entry.type === 'date' && entry.date) {
        const d = new Date(entry.date.getFullYear(), entry.date.getMonth(), entry.date.getDate());
        if (curTs === undefined || d.getTime() !== curTs) {
          days.add(d.getTime());
        }
      }
    }
    return days;
  });
}
