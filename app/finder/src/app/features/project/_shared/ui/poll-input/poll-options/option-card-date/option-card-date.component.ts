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
import { HlmButton } from '@spartan-ng/helm/button';
import { DatePicker } from 'primeng/datepicker';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { DateOptionEntry, nextFullHour } from '../../../../utils/date-option.utils';
import { UserStore } from '../../../../../../../common/data/user.store';

@Component({
  selector: 'app-option-card-date',
  templateUrl: './option-card-date.component.html',
  imports: [FormsModule, HlmButton, DatePicker, TranslatePipe, ...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardDateComponent {
  protected readonly userStore = inject(UserStore);

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
}
