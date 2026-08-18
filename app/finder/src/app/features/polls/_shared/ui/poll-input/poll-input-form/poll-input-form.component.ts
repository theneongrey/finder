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
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { OptionType } from '../../../models/poll-detail.model';
import {
  PollOptionsComponent,
  OptionEntry,
  DateOptionEntry,
  DateOptionType,
} from '../poll-options/poll-options.component';
import { DsTextareaComponent } from '@ds/textarea/ds-textarea.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsCardComponent } from '@ds/card/ds-card.component';

export type { OptionEntry, DateOptionEntry, DateOptionType };

@Component({
  selector: 'app-poll-input-form',
  templateUrl: './poll-input-form.component.html',
  imports: [
    DatePipe,
    FormsModule,
    TranslatePipe,
    DsTextareaComponent,
    DsInputComponent,
    DsButtonComponent,
    DsCardComponent,
    PollOptionsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollInputFormComponent {
  readonly OptionType = OptionType;

  readonly deadlinePresets = [
    { id: 'd3',  labelKey: 'project.pollInput.autoCloseIn3Days' },
    { id: 'w1',  labelKey: 'project.pollInput.autoCloseIn1Week' },
    { id: 'w2',  labelKey: 'project.pollInput.autoCloseIn2Weeks' },
    { id: 'none', labelKey: 'project.pollInput.autoCloseNoEnd' },
  ];

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
  formSubmit = output<void>();

  showDescription = signal(false);
  selectedDeadline = signal<string | undefined>(undefined);
  anonymousVoting = signal(false);

  private injector = inject(Injector);
  private descriptionTextarea =
    viewChild<DsTextareaComponent>('descriptionTextarea');

  constructor() {
    effect(() => {
      if (this.description()) {
        this.showDescription.set(true);
      }
    });

    afterNextRender(() => {
      if (this.mode() !== 'edit' && !this.closeDate()) {
        this.onDeadlinePreset('w1');
      }
    }, { injector: this.injector });
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

  toggleAnonymousVoting(): void {
    this.anonymousVoting.update(v => !v);
  }

  onDeadlinePreset(id: string): void {
    this.selectedDeadline.set(id);
    if (id === 'none') {
      this.closeDateChange.emit(undefined);
      return;
    }
    const days = id === 'd3' ? 3 : id === 'w1' ? 7 : 14;
    const d = new Date();
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    this.closeDateChange.emit(`${year}-${month}-${day}T18:00:00.000Z`);
  }

  onCustomEndChange(value: string): void {
    this.selectedDeadline.set(undefined);
    if (!value) {
      this.closeDateChange.emit(undefined);
      return;
    }
    this.closeDateChange.emit(`${value}:00.000Z`);
  }

  get customEndValue(): string {
    const cd = this.closeDate();
    if (!cd) { return ''; }
    return cd.substring(0, 16);
  }
}
