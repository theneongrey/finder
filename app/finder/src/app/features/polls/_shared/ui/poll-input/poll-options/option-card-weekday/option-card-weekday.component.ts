import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DateOptionEntry, formatTime, nextFullHour, parseTimeInput } from '../../../../utils/date-option.utils';

@Component({
  selector: 'app-option-card-weekday',
  templateUrl: './option-card-weekday.component.html',
  imports: [FormsModule, DsButtonComponent, DsInputComponent, DsCardComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardWeekdayComponent {
  private readonly translate = inject(TranslateService);

  option = input.required<DateOptionEntry>();
  index = input.required<number>();
  canRemove = input<boolean>(false);
  initialShowTime = input<boolean>(false);
  readonly = input<boolean>(false);
  remove = output<void>();

  showTime = signal(false);

  readonly weekdayButtons = [1, 2, 3, 4, 5, 6, 0].map((v) => ({
    value: v,
    label: this.translate.instant(`project.pollInput.date.weekdaysShort.${v}`),
    ariaLabel: this.translate.instant(`project.pollInput.date.weekdays.${v}`),
  }));

  constructor() {
    effect(() => {
      const shouldShow = !!(this.option().startTime) || this.initialShowTime();
      if (shouldShow) {
        if (this.initialShowTime() && !this.option().startTime) {
          this.option().startTime = nextFullHour();
        }
        this.showTime.set(true);
      } else {
        this.showTime.set(false);
      }
    });
  }

  selectWeekday(value: number): void {
    this.option().weekday = value;
  }

  get timeValue(): string {
    return this.option().startTime ? formatTime(this.option().startTime!) : '';
  }

  setStartTime(value: string): void {
    this.option().startTime = parseTimeInput(value);
  }
}
