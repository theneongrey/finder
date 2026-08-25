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
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DsEmptyStateButtonComponent } from '@ds/empty-state-button/ds-empty-state-button.component';
import { OptionCardComponent } from './option-card/option-card.component';
import { OptionCardDateComponent } from './option-card-date/option-card-date.component';
import { OptionCardWeekdayComponent } from './option-card-weekday/option-card-weekday.component';
import { OptionCardDateRangeComponent } from './option-card-date-range/option-card-date-range.component';
import { OptionCardTimeComponent } from './option-card-time/option-card-time.component';
import { OptionCardTimeRangeComponent } from './option-card-time-range/option-card-time-range.component';
import { AppointmentTypeSelectionComponent } from './appointment-type-selection/appointment-type-selection.component';
import { OptionType } from '@common/models/option-type.model';
import { DateOptionFormatService } from '../../../utils/date-option-format.service';
import {
  DateOptionEntry,
  DateOptionType,
} from '../../../models/date-option.model';

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

@Component({
  selector: 'app-poll-options',
  templateUrl: './poll-options.component.html',
  styleUrl: './poll-options.component.css',
  imports: [
    DsButtonComponent,
    DsCardComponent,
    DsEmptyStateButtonComponent,
    TranslatePipe,
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
  private readonly dateOptionFormat = inject(DateOptionFormatService);

  readonly OptionType = OptionType;

  titleKey = input.required<string>();
  subtitleKey = input.required<string>();
  optionType = input.required<OptionType>();
  options = input.required<OptionEntry[]>();
  dateOptions = input.required<DateOptionEntry[]>();
  appointmentDateType = input<DateOptionType | undefined>(undefined);
  readonly = input<boolean>(false);
  add = output<void>();
  remove = output<number>();
  appointmentDateTypeSelected = output<DateOptionType>();
  weekdayToggle = output<number>();
  dateOptionsChange = output<DateOptionEntry[]>();
  optionsChange = output<OptionEntry[]>();

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

  getStars(index: number): string {
    return '★'.repeat(index + 1);
  }

  updateDateOption(index: number, entry: DateOptionEntry): void {
    const updated = this.dateOptions().map((o, i) => (i === index ? entry : o));
    this.dateOptionsChange.emit(updated);
  }

  updateOption(index: number, entry: OptionEntry): void {
    const updated = this.options().map((o, i) => (i === index ? entry : o));
    this.optionsChange.emit(updated);
  }

  onToggleTime(value: boolean): void {
    if (value) {
      const start = this.dateOptionFormat.nextFullHour();
      const updated = this.dateOptions().map((o) => {
        if (o.startTime) {
          return o;
        }
        const changes: Partial<DateOptionEntry> = { startTime: start };
        if (this.appointmentDateType() === 'date-range' && !o.endTime) {
          const end = new Date(start);
          end.setHours(end.getHours() + 1);
          changes.endTime = end;
        }
        return { ...o, ...changes };
      });
      this.dateOptionsChange.emit(updated);
      this.firstEntryShowsTime.set(true);
    } else {
      const updated = this.dateOptions().map((o) => ({
        ...o,
        startTime: undefined,
        endTime: undefined,
      }));
      this.dateOptionsChange.emit(updated);
      this.firstEntryShowsTime.set(false);
    }
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
