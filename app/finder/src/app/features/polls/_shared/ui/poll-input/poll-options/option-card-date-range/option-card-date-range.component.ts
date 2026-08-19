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
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DateOptionEntry, formatTime, nextFullHour, parseTimeInput } from '../../../../utils/date-option.utils';

@Component({
  selector: 'app-option-card-date-range',
  templateUrl: './option-card-date-range.component.html',
  imports: [FormsModule, DsButtonComponent, DsIconComponent, DsInputComponent, DsCardComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardDateRangeComponent {

  option = input.required<DateOptionEntry>();
  index = input.required<number>();
  canRemove = input<boolean>(false);
  initialShowTime = input<boolean>(false);
  readonly = input<boolean>(false);
  remove = output<void>();

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
      const shouldShow = !!(opt.startTime || opt.endTime) || this.initialShowTime();
      if (shouldShow) {
        if (this.initialShowTime() && !opt.startTime) {
          const start = nextFullHour();
          const end = new Date(start);
          end.setHours(end.getHours() + 1);
          opt.startTime = start;
          opt.endTime = end;
        }
        this.showTime.set(true);
      } else {
        this.showTime.set(false);
      }
    });
  }

  get startDateValue(): string {
    const d = this.startDate();
    return d ? formatDate(d, 'yyyy-MM-dd', 'en') : '';
  }

  get endDateValue(): string {
    const d = this.endDate();
    return d ? formatDate(d, 'yyyy-MM-dd', 'en') : '';
  }

  setStartDate(value: string): void {
    const d = value ? this.parseDate(value) : undefined;
    this.startDate.set(d);
    this.option().date = d;
  }

  setEndDate(value: string): void {
    const d = value ? this.parseDate(value) : undefined;
    this.endDate.set(d);
    this.option().endDate = d;
  }

  get startTimeValue(): string {
    return this.option().startTime ? formatTime(this.option().startTime!) : '';
  }

  get endTimeValue(): string {
    return this.option().endTime ? formatTime(this.option().endTime!) : '';
  }

  setStartTime(value: string): void {
    this.option().startTime = parseTimeInput(value);
  }

  setEndTime(value: string): void {
    this.option().endTime = parseTimeInput(value);
  }

  private parseDate(value: string): Date {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
}
