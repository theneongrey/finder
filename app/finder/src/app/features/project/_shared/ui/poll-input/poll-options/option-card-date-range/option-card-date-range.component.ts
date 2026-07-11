import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { TranslatePipe } from '@ngx-translate/core';
import { Card } from 'primeng/card';
import { DateOptionEntry } from '../../../../utils/date-option.utils';

@Component({
  selector: 'app-option-card-date-range',
  templateUrl: './option-card-date-range.component.html',
  imports: [FormsModule, Button, DatePicker, TranslatePipe, Card],
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

  constructor() {
    effect(() => {
      if (this.option().startTime || this.option().endTime || this.initialShowTime()) {
        this.showTime.set(true);
      }
    });
  }

  addTime(): void {
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
