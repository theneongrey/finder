import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { HlmCard } from '@spartan-ng/helm/card';
import { AddCardComponent } from '../../../../../../common/ui/components/add-card/add-card.component';
import { OptionCardComponent } from './option-card/option-card.component';
import { OptionCardDateComponent } from './option-card-date/option-card-date.component';
import { OptionCardWeekdayComponent } from './option-card-weekday/option-card-weekday.component';
import { OptionCardDateRangeComponent } from './option-card-date-range/option-card-date-range.component';
import { OptionCardTimeComponent } from './option-card-time/option-card-time.component';
import { OptionCardTimeRangeComponent } from './option-card-time-range/option-card-time-range.component';
import { AppointmentTypeSelectionComponent } from './appointment-type-selection/appointment-type-selection.component';
import { OptionType } from '../../../models/project-detail.model';
import {
  DateOptionEntry,
  DateOptionType,
  nextFullHour,
} from '../../../utils/date-option.utils';

export interface OptionEntry {
  id?: string;
  text: string;
  description: string;
  meta?: {
    url: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    siteName?: string;
  };
}

export type { DateOptionEntry, DateOptionType };

@Component({
  selector: 'app-poll-options',
  templateUrl: './poll-options.component.html',
  styleUrl: './poll-options.component.css',
  imports: [
    AddCardComponent,
    TranslatePipe,
    HlmCard,
    OptionCardComponent,
    OptionCardDateComponent,
    OptionCardWeekdayComponent,
    OptionCardDateRangeComponent,
    OptionCardTimeComponent,
    OptionCardTimeRangeComponent,
    AppointmentTypeSelectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollOptionsComponent {
  private readonly translate = inject(TranslateService);

  readonly OptionType = OptionType;

  titleKey = input.required<string>();
  subtitleKey = input.required<string>();
  optionType = input.required<OptionType>();
  options = input.required<OptionEntry[]>();
  dateOptions = input.required<DateOptionEntry[]>();
  appointmentDateType = input<DateOptionType | undefined>(undefined);
  add = output<void>();
  remove = output<number>();
  appointmentDateTypeSelected = output<DateOptionType>();
  weekdayToggle = output<number>();

  addCardAnimating = signal(false);
  firstEntryShowsTime = signal(false);

  readonly weekdayButtons = [1, 2, 3, 4, 5, 6, 0].map((v) => ({
    value: v,
    label: this.translate.instant(`project.pollInput.date.weekdaysShort.${v}`),
    ariaLabel: this.translate.instant(`project.pollInput.date.weekdays.${v}`),
  }));

  readonly selectedWeekdays = computed(() =>
    this.dateOptions()
      .map((o) => o.weekday)
      .filter((w): w is number => w !== undefined),
  );

  readonly weekdayShowsTime = computed(
    () =>
      this.firstEntryShowsTime() ||
      this.dateOptions().some((o) => o.startTime !== undefined),
  );

  constructor() {
    effect(() => {
      this.appointmentDateType();
      this.firstEntryShowsTime.set(false);
    });
  }

  onFirstEntryShowTimeChange(value: boolean): void {
    this.firstEntryShowsTime.set(value);
    if (!value) {
      this.dateOptions().forEach((o) => (o.startTime = undefined));
    }
  }

  onGroupedAddTime(): void {
    if (this.dateOptions().length === 0) { return; }
    const start = nextFullHour();
    this.dateOptions().forEach((o) => { if (!o.startTime) { o.startTime = start; } });
    this.firstEntryShowsTime.set(true);
  }

  onAdd() {
    this.add.emit();
    this.triggerAddCardAnimation();
  }

  private triggerAddCardAnimation() {
    this.addCardAnimating.set(false);
    requestAnimationFrame(() => this.addCardAnimating.set(true));
  }
}
