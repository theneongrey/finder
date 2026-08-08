import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  Injector,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmButton } from '@spartan-ng/helm/button';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionType } from '../../../models/poll-detail.model';
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
    HlmInput,
    HlmButton,
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
  closeDate = input<string | undefined>(undefined);
  closeDateChange = output<string | undefined>();
  add = output<void>();
  remove = output<number>();
  weekdayToggle = output<number>();
  formSubmit = output<void>();

  showDescription = signal(false);
  showCloseDate = signal(false);

  private injector = inject(Injector);
  private descriptionTextarea =
    viewChild<AutoResizeTextareaComponent>('descriptionTextarea');

  constructor() {
    effect(() => {
      if (this.description()) {
        this.showDescription.set(true);
      }
    });
    effect(() => {
      if (this.closeDate()) {
        this.showCloseDate.set(true);
      }
    });
  }

  toggleDescription(): void {
    this.showDescription.set(true);
    afterNextRender(() => this.descriptionTextarea()?.focus(), {
      injector: this.injector,
    });
  }

  onDescriptionBlur(): void {
    if (!this.description()) {
      this.showDescription.set(false);
    }
  }

  toggleCloseDate(enabled: boolean): void {
    this.showCloseDate.set(enabled);
    if (!enabled) {
      this.closeDateChange.emit(undefined);
    }
  }

  onCloseDateChange(date: string, time: string): void {
    if (!date) { return; }
    const iso = time ? `${date}T${time}:00.000Z` : `${date}T00:00:00.000Z`;
    this.closeDateChange.emit(iso);
  }

  get closeDatePart(): string {
    const cd = this.closeDate();
    return cd ? cd.substring(0, 10) : '';
  }

  get closeTimePart(): string {
    const cd = this.closeDate();
    if (!cd) { return ''; }
    const t = cd.substring(11, 16);
    return t || '';
  }
}
