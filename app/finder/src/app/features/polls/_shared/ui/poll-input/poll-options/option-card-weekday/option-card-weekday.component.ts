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
  canRemoveTime = input<boolean>(true);
  initialShowTime = input<boolean>(false);
  remove = output<void>();
  showTimeChange = output<boolean>();

  showTime = signal(false);

  readonly weekdayButtons = [1, 2, 3, 4, 5, 6, 0].map((v) => ({
    value: v,
    label: this.translate.instant(`project.pollInput.date.weekdaysShort.${v}`),
    ariaLabel: this.translate.instant(`project.pollInput.date.weekdays.${v}`),
  }));

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

  selectWeekday(value: number): void {
    this.option().weekday = value;
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

  get timeValue(): string {
    return this.option().startTime ? formatTime(this.option().startTime!) : '';
  }

  setStartTime(value: string): void {
    this.option().startTime = parseTimeInput(value);
  }
}
