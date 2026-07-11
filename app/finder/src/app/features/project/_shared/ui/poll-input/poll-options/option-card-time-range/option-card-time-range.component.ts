import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { TranslatePipe } from '@ngx-translate/core';
import { Card } from 'primeng/card';
import { DateOptionEntry } from '../../../../utils/date-option.utils';

@Component({
  selector: 'app-option-card-time-range',
  templateUrl: './option-card-time-range.component.html',
  imports: [FormsModule, Button, DatePicker, TranslatePipe, Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardTimeRangeComponent {
  option = input.required<DateOptionEntry>();
  index = input.required<number>();
  canRemove = input<boolean>(false);
  remove = output<void>();

  onStartTimeChange(): void {
    const entry = this.option();
    if (entry.startTime && !entry.endTime) {
      const endTime = new Date(entry.startTime);
      endTime.setHours(endTime.getHours() + 1);
      entry.endTime = endTime;
    }
  }
}
