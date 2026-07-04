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
import { DateOptionEntry } from '../poll-options.component';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-option-card-date',
  templateUrl: './option-card-date.component.html',
  imports: [FormsModule, Button, DatePicker, TranslatePipe, Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardDateComponent {
  option = input.required<DateOptionEntry>();
  index = input.required<number>();
  canRemove = input<boolean>(false);
  remove = output<void>();
}
