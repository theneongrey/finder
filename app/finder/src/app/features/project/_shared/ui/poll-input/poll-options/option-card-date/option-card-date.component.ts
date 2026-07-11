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
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { TranslatePipe } from '@ngx-translate/core';
import { Card } from 'primeng/card';
import { DateOptionEntry } from '../../../../utils/date-option.utils';
import { UserStore } from '../../../../../../../common/data/user.store';

@Component({
  selector: 'app-option-card-date',
  templateUrl: './option-card-date.component.html',
  imports: [FormsModule, Button, DatePicker, TranslatePipe, Card],
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
    this.showTime.set(false);
    this.showTimeChange.emit(false);
  }
}
