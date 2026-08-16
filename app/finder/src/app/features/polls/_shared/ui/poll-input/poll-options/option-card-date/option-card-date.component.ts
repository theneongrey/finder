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
  remove = output<void>();
  showTimeChange = output<boolean>();

  showTime = signal(false);

  constructor() {
    effect(() => {
      if (this.option().startTime || this.initialShowTime()) {
        if (this.initialShowTime() && !this.option().startTime) {
          this.option().startTime = nextFullHour();
        }
        this.showTime.set(true);
      }
    });
  }

  addTime(): void {
    if (!this.option().startTime) {
      this.option().startTime = nextFullHour();
    }
    this.showTime.set(true);
    this.showTimeChange.emit(true);
  }

  removeTime(): void {
    this.option().startTime = undefined;
    this.showTime.set(false);
    this.showTimeChange.emit(false);
  }

  get dateValue(): string {
    const d = this.option().date;
    return d ? formatDate(d, 'yyyy-MM-dd', 'en') : '';
  }

  setDate(value: string): void {
    if (!value) { this.option().date = undefined; return; }
    const [y, m, d] = value.split('-').map(Number);
    this.option().date = new Date(y, m - 1, d);
  }

  get timeValue(): string {
    return this.option().startTime ? formatTime(this.option().startTime!) : '';
  }

  setStartTime(value: string): void {
    this.option().startTime = parseTimeInput(value);
  }
}
