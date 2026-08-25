import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import {
  OptionEntry,
  PollOptionsComponent,
} from './poll-options/poll-options.component';
import { PollCloseSettingsComponent } from './poll-close-settings/poll-close-settings.component';
import { PollQuestionCardComponent } from './poll-question-card/poll-question-card.component';
import { OptionType } from '@common/models/option-type.model';
import {
  DateOptionEntry,
  DateOptionType,
} from '../../models/date-option.model';

@Component({
  selector: 'app-poll-input-form',
  templateUrl: './poll-input-form.component.html',
  imports: [
    TranslatePipe,
    DsButtonComponent,
    PollOptionsComponent,
    PollQuestionCardComponent,
    PollCloseSettingsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollInputFormComponent {
  readonly OptionType = OptionType;

  mode = input.required<'add' | 'edit' | 'standalone'>();
  hideCta = input<boolean>(false);
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
  closeDate = input<string | undefined>(undefined);
  closeDateChange = output<string | undefined>();
  isClosed = input<boolean>(false);
  closedAt = input<string | undefined>(undefined);
  closePollNow = output<void>();
  reopenPoll = output<void>();
  add = output<void>();
  remove = output<number>();
  weekdayToggle = output<number>();
  optionsChange = output<OptionEntry[]>();
  dateOptionsChange = output<DateOptionEntry[]>();
  formSubmit = output<void>();
}
