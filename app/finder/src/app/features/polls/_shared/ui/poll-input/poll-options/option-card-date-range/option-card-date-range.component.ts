import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { DateOptionEntry, formatTime, nextFullHour, parseTimeInput } from '../../../../utils/date-option.utils';

@Component({
  selector: 'app-option-card-date-range',
  templateUrl: './option-card-date-range.component.html',
  imports: [FormsModule, HlmButton, HlmInput, ...HlmDatePickerImports, TranslatePipe, ...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardDateRangeComponent {

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
    return date ? formatDate(date, 'mediumDate', 'en') : '';
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

  onStartDateChange(date: Date | null): void {
    const d = date ?? undefined;
    this.startDate.set(d);
    this.option().date = d;
  }

  onEndDateChange(date: Date | null): void {
    const d = date ?? undefined;
    this.endDate.set(d);
    this.option().endDate = d;
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

  protected getTimeValue(date: Date | undefined): string {
    return date ? formatTime(date) : '';
  }

  setStartTime(event: Event): void {
    this.option().startTime = parseTimeInput((event.target as HTMLInputElement).value);
  }

  setEndTime(event: Event): void {
    this.option().endTime = parseTimeInput((event.target as HTMLInputElement).value);
  }
}
