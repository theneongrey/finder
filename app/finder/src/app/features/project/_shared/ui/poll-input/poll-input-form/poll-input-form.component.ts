import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionType } from '../../../models/project-detail.model';
import {
  PollOptionsComponent,
  OptionEntry,
  DateOptionEntry,
  DateOptionType,
} from '../poll-options/poll-options.component';
import { AutoResizeTextareaComponent } from '../../../../../../common/ui/components/auto-resize-textarea/auto-resize-textarea.component';

export type { OptionEntry, DateOptionEntry, DateOptionType };

@Component({
  selector: 'app-poll-input-form',
  templateUrl: './poll-input-form.component.html',
  imports: [
    FormsModule,
    InputText,
    Button,
    TranslatePipe,
    AutoResizeTextareaComponent,
    PollOptionsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollInputFormComponent {
  readonly OptionType = OptionType;

  mode = input.required<'add' | 'edit' | 'standalone'>();
  isValid = input.required<boolean>();
  optionType = input.required<OptionType>();
  question = input.required<string>();
  questionChange = output<string>();
  description = input.required<string>();
  descriptionChange = output<string>();
  options = input.required<OptionEntry[]>();
  dateOptions = input.required<DateOptionEntry[]>();
  appointmentDateType = input<DateOptionType | undefined>(undefined);
  appointmentDateTypeChange = output<DateOptionType>();
  add = output<void>();
  remove = output<number>();
  weekdayToggle = output<number>();
  formSubmit = output<void>();
}
