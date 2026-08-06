import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { DateOptionEntry, nextFullHour } from '../../../../utils/date-option.utils';
import { UserStore } from '../../../../../../../common/data/user.store';

@Component({
  selector: 'app-option-card-date-range',
  templateUrl: './option-card-date-range.component.html',
  imports: [FormsModule, Button, DatePicker, TranslatePipe, ...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardDateRangeComponent {
  protected readonly userStore = inject(UserStore);

  option = input.required<DateOptionEntry>();
  index = input.required<number>();
  canRemove = input<boolean>(false);
  initialShowTime = input<boolean>(false);
  remove = output<void>();
  showTimeChange = output<boolean>();

  showTime = signal(false);
  startDate = signal<Date | undefined>(undefined);
  endDate = signal<Date | undefined>(undefined);

  readonly endBeforeStart = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    return start !== undefined && end !== undefined && end < start;
  });

  readonly formattedStartDate = computed(() => {
    const date = this.startDate();
    return date ? formatDate(date, this.userStore.dateFormat(), 'en') : '';
  });

  constructor() {
    effect(() => {
      const opt = this.option();
      this.startDate.set(opt.date);
      this.endDate.set(opt.endDate);
      if (opt.startTime || opt.endTime || this.initialShowTime()) {
        if (this.initialShowTime() && !opt.startTime) {
          const start = nextFullHour();
          const end = new Date(start);
          end.setHours(end.getHours() + 1);
          opt.startTime = start;
          opt.endTime = end;
        }
        this.showTime.set(true);
      }
    });
  }

  onStartDateChange(date: Date | undefined): void {
    this.startDate.set(date);
    this.option().date = date;
  }

  onEndDateChange(date: Date | undefined): void {
    this.endDate.set(date);
    this.option().endDate = date;
  }

  addTime(): void {
    if (!this.option().startTime) {
      const start = nextFullHour();
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      this.option().startTime = start;
      this.option().endTime = end;
    }
    this.showTime.set(true);
    this.showTimeChange.emit(true);
  }

  removeTime(): void {
    this.option().startTime = undefined;
    this.option().endTime = undefined;
    this.showTime.set(false);
    this.showTimeChange.emit(false);
  }
}
