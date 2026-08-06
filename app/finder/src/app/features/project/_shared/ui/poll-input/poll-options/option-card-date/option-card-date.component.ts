import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { DateOptionEntry, formatTime, nextFullHour, parseTimeInput } from '../../../../utils/date-option.utils';

@Component({
  selector: 'app-option-card-date',
  templateUrl: './option-card-date.component.html',
  imports: [FormsModule, HlmButton, HlmInput, ...HlmDatePickerImports, TranslatePipe, ...HlmCardImports],
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

  protected getTimeValue(date: Date | undefined): string {
    return date ? formatTime(date) : '';
  }

  setStartTime(event: Event): void {
    this.option().startTime = parseTimeInput((event.target as HTMLInputElement).value);
  }
}
