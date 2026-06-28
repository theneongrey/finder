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
import { OptionType } from '../../../_models/project-detail.model';
import {
  TopicOptionsComponent,
  OptionEntry,
  DateOptionEntry,
} from '../topic-options/topic-options.component';
import { AutoResizeTextareaComponent } from '../../../../../common/ui/components/auto-resize-textarea/auto-resize-textarea.component';

export type { OptionEntry, DateOptionEntry };

@Component({
  selector: 'app-topic-input-form',
  templateUrl: './topic-input-form.component.html',
  imports: [
    FormsModule,
    InputText,
    Button,
    TranslatePipe,
    AutoResizeTextareaComponent,
    TopicOptionsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicInputFormComponent {
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
  add = output<void>();
  remove = output<number>();
  formSubmit = output<void>();
}
