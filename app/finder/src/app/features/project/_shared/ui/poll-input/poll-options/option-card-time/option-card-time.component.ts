import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { DatePicker } from 'primeng/datepicker';
import { TranslatePipe } from '@ngx-translate/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { DateOptionEntry } from '../../../../utils/date-option.utils';

@Component({
  selector: 'app-option-card-time',
  templateUrl: './option-card-time.component.html',
  imports: [FormsModule, HlmButton, DatePicker, TranslatePipe, ...HlmCardImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardTimeComponent {
  option = input.required<DateOptionEntry>();
  index = input.required<number>();
  canRemove = input<boolean>(false);
  remove = output<void>();
}
