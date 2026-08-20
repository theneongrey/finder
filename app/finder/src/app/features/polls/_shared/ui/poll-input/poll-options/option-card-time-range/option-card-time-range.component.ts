import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DateOptionEntry, formatTime, parseTimeInput } from '../../../../utils/date-option.utils';

@Component({
  selector: 'app-option-card-time-range',
  templateUrl: './option-card-time-range.component.html',
  imports: [FormsModule, DsButtonComponent, DsInputComponent, DsCardComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardTimeRangeComponent {
  option = input.required<DateOptionEntry>();
  index = input.required<number>();
  canRemove = input<boolean>(false);
  readonly = input<boolean>(false);
  remove = output<void>();
  optionChange = output<DateOptionEntry>();

  get startTimeValue(): string {
    return this.option().startTime ? formatTime(this.option().startTime!) : '';
  }

  get endTimeValue(): string {
    return this.option().endTime ? formatTime(this.option().endTime!) : '';
  }

  onStartTimeChange(value: string): void {
    const startTime = parseTimeInput(value);
    let endTime = this.option().endTime;
    if (startTime && !endTime) {
      endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);
    }
    this.optionChange.emit({ ...this.option(), startTime, endTime });
  }

  setEndTime(value: string): void {
    this.optionChange.emit({ ...this.option(), endTime: parseTimeInput(value) });
  }
}
