import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { DateOptionEntry, formatTime, parseTimeInput } from '../../../../utils/date-option.utils';

@Component({
  selector: 'app-option-card-time-range',
  templateUrl: './option-card-time-range.component.html',
  imports: [HlmButton, HlmInput, TranslatePipe, ...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardTimeRangeComponent {
  option = input.required<DateOptionEntry>();
  index = input.required<number>();
  canRemove = input<boolean>(false);
  remove = output<void>();

  protected getTimeValue(date: Date | undefined): string {
    return date ? formatTime(date) : '';
  }

  onStartTimeChange(event: Event): void {
    const entry = this.option();
    entry.startTime = parseTimeInput((event.target as HTMLInputElement).value);
    if (entry.startTime && !entry.endTime) {
      const endTime = new Date(entry.startTime);
      endTime.setHours(endTime.getHours() + 1);
      entry.endTime = endTime;
    }
  }

  setEndTime(event: Event): void {
    this.option().endTime = parseTimeInput((event.target as HTMLInputElement).value);
  }
}
