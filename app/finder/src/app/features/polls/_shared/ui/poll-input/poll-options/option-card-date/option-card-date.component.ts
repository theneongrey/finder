import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DateOptionEntry, formatTime, nextFullHour, parseTimeInput } from '../../../../utils/date-option.utils';

@Component({
  selector: 'app-option-card-date',
  templateUrl: './option-card-date.component.html',
  imports: [FormsModule, DsButtonComponent, DsInputComponent, DsCardComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardDateComponent {

  option = input.required<DateOptionEntry>();
  index = input.required<number>();
  canRemove = input<boolean>(false);
  initialShowTime = input<boolean>(false);
  readonly = input<boolean>(false);
  remove = output<void>();
  optionChange = output<DateOptionEntry>();

  showTime = signal(false);

  constructor() {
    effect(() => {
      const opt = this.option();
      const shouldShow = !!(opt.startTime) || this.initialShowTime();
      if (shouldShow) {
        if (this.initialShowTime() && !opt.startTime) {
          this.optionChange.emit({ ...opt, startTime: nextFullHour() });
        }
        this.showTime.set(true);
      } else {
        this.showTime.set(false);
      }
    });
  }

  get dateValue(): string {
    const d = this.option().date;
    return d ? formatDate(d, 'yyyy-MM-dd', 'en') : '';
  }

  setDate(value: string): void {
    if (!value) { this.optionChange.emit({ ...this.option(), date: undefined }); return; }
    const [y, m, d] = value.split('-').map(Number);
    this.optionChange.emit({ ...this.option(), date: new Date(y, m - 1, d) });
  }

  get timeValue(): string {
    return this.option().startTime ? formatTime(this.option().startTime!) : '';
  }

  setStartTime(value: string): void {
    this.optionChange.emit({ ...this.option(), startTime: parseTimeInput(value) });
  }
}
