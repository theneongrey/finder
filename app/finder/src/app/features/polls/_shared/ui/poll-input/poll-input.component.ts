import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { PollDetailStore } from '../../data/poll-detail.store';
import { PollListStore } from '../../data/poll-list.store';
import { OptionType } from '../../models/poll-detail.model';
import {
  OptionEntry,
  DateOptionEntry,
  DateOptionType,
} from './poll-input-form/poll-input-form.component';
import {
  parseDateOptionText,
  serializeDateOption,
  isDateOptionEntryValid,
  nextFullHour,
} from '../../utils/date-option.utils';
import { UrlValidationService } from '../../../../../common/utils/url-validation.service';
import { TitleBarService } from '../../../../../common/services/title-bar.service';
import { AppointmentTypeConversionService } from '../../utils/appointment-type-conversion.service';
import { ActivatedRoute } from '@angular/router';
import { PollTypeSelectionComponent } from './poll-type-selection/poll-type-selection.component';
import { PollInputFormComponent } from './poll-input-form/poll-input-form.component';

export type { OptionEntry, DateOptionEntry, DateOptionType };

@Component({
  selector: 'app-poll-input',
  templateUrl: './poll-input.component.html',
  host: { class: 'block h-full' },
  imports: [PollTypeSelectionComponent, PollInputFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollInputComponent {
  private readonly projectDetailStore = inject(PollDetailStore);
  private readonly projectListStore = inject(PollListStore);
  private readonly route = inject(ActivatedRoute);
  private readonly urlValidation = inject(UrlValidationService);
  private readonly conversionService = inject(AppointmentTypeConversionService);

  readonly OptionType = OptionType;

  mode = input<'add' | 'edit' | 'standalone'>('add');
  projectId = this.projectDetailStore.projectId;
  pollId = input<string | undefined>(undefined);

  optionType = signal<OptionType | undefined>(
    this.route.snapshot.data['optionType'],
  );

  question = signal('');
  description = signal('');
  closeDate = signal<string | undefined>(undefined);
  options = signal<OptionEntry[]>([{ text: '', description: '' }]);
  dateOptions = signal<DateOptionEntry[]>([]);
  appointmentDateType = signal<DateOptionType | undefined>(undefined);
  removedOptionIds = signal<string[]>([]);

  constructor() {
    const titleService = inject(TitleBarService);

    effect(() => {
      if (this.mode() !== 'standalone') {
        titleService.setTitle(this.projectDetailStore.currentProject()?.name ?? '');
      }
    });

    effect(() => {
      const pollId = this.pollId();
      if (this.mode() === 'edit' && pollId) {
        this.projectDetailStore.getPoll(pollId);
      }
    });

    effect(() => {
      const currentPoll = this.projectDetailStore.currentPoll();
      if (
        this.mode() === 'edit' &&
        currentPoll &&
        currentPoll.id === this.pollId()
      ) {
        this.question.set(currentPoll.name);
        this.description.set(currentPoll.description);
        this.closeDate.set(currentPoll.closeDate);

        if (currentPoll.optionType === OptionType.Date) {
          const entries = currentPoll.options.length
            ? currentPoll.options.map((o) => parseDateOptionText(o.text, o.id))
            : [];

          if (entries.length > 0) {
            this.appointmentDateType.set(entries[0].type);
            this.dateOptions.set(entries);
          }
        } else {
          this.options.set(
            currentPoll.options.length
              ? currentPoll.options.map((o) => ({
                  id: o.id,
                  text: o.text,
                  description: o.description,
                  meta: o.meta
                    ? {
                        url: o.meta.url,
                        title: o.meta.title,
                        description: o.meta.description,
                        imageUrl: o.meta.imageUrl,
                        siteName: o.meta.siteName,
                      }
                    : undefined,
                }))
              : [{ text: '', description: '' }],
          );
        }
      }
    });
  }

  isValid(): boolean {
    const type = this.optionType();
    if (type === undefined) {
      return false;
    }
    if (type === OptionType.Date) {
      const dateType = this.appointmentDateType();
      if (!dateType) { return false; }
      return (
        !!this.question() &&
        this.dateOptions().some((o) => isDateOptionEntryValid(o))
      );
    }
    const opts = this.options();
    return (
      !!this.question() &&
      opts.filter((o) => !!o.text).length >= 1 &&
      opts.every((o) => !o.meta?.url || this.urlValidation.isValid(o.meta.url))
    );
  }

  onAppointmentDateTypeChange(newType: DateOptionType): void {
    const oldType = this.appointmentDateType();
    if (oldType === newType) {
      return;
    }
    if (oldType) {
      const converted = this.conversionService.convert(this.dateOptions(), oldType, newType);
      const fallback = newType === 'weekday' ? [] : [{ type: newType }];
      this.dateOptions.set(converted.length > 0 ? converted : fallback);
    } else {
      this.dateOptions.set(newType === 'weekday' ? [] : [{ type: newType }]);
    }
    this.appointmentDateType.set(newType);
  }

  toggleWeekday(weekday: number): void {
    const opts = this.dateOptions();
    const existingIndex = opts.findIndex((o) => o.weekday === weekday);
    if (existingIndex !== -1) {
      const removed = opts[existingIndex];
      if (removed.id) {
        this.removedOptionIds.update((ids) => [...ids, removed.id!]);
      }
      this.dateOptions.update((opts) => opts.filter((_, i) => i !== existingIndex));
    } else {
      this.dateOptions.update((opts) => [...opts, { type: 'weekday', weekday }]);
    }
  }

  addOption(): void {
    const type = this.optionType();
    if (type === OptionType.Date) {
      const dateType = this.appointmentDateType();
      if (!dateType) { return; }
      if (dateType === 'time') {
        this.dateOptions.update((opts) => [...opts, { type: 'time', startTime: nextFullHour() }]);
      } else if (dateType === 'time-range') {
        const start = nextFullHour();
        const end = new Date(start);
        end.setHours(end.getHours() + 1);
        this.dateOptions.update((opts) => [...opts, { type: 'time-range', startTime: start, endTime: end }]);
      } else {
        this.dateOptions.update((opts) => [...opts, { type: dateType }]);
      }
    } else {
      this.options.update((opts) => [...opts, { text: '', description: '' }]);
    }
  }

  removeOption(index: number): void {
    const type = this.optionType();
    if (type === OptionType.Date) {
      const removed = this.dateOptions()[index];
      if (removed?.id) {
        this.removedOptionIds.update((ids) => [...ids, removed.id!]);
      }
      this.dateOptions.update((opts) => opts.filter((_, i) => i !== index));
    } else {
      const removedOption = this.options()[index];
      if (removedOption?.id) {
        this.removedOptionIds.update((ids) => [...ids, removedOption.id!]);
      }
      this.options.update((opts) => opts.filter((_, i) => i !== index));
    }
  }

  submit(): void {
    if (this.mode() === 'add') {
      this.addPoll();
    } else if (this.mode() === 'edit') {
      this.editPoll();
    } else if (this.mode() === 'standalone') {
      this.addStandalonePoll();
    }
  }

  private addPoll(): void {
    const projectId = this.projectId();
    const optionType = this.optionType();
    if (!projectId || optionType === undefined || !this.isValid()) {
      return;
    }

    if (optionType === OptionType.Date) {
      const options = this.dateOptions()
        .filter((o) => isDateOptionEntryValid(o))
        .map((o) => ({
          text: serializeDateOption(o),
          description: '',
        }));

      this.projectDetailStore.addPoll({
        projectId,
        name: this.question(),
        description: this.description(),
        optionType: OptionType.Date,
        options,
      });
    } else {
      const options = this.options()
        .filter((o) => !!o.text)
        .map((o) => ({
          text: o.text,
          description: o.description,
          meta: o.meta,
        }));

      this.projectDetailStore.addPoll({
        projectId,
        name: this.question(),
        description: this.description(),
        optionType,
        options,
      });
    }
  }

  private addStandalonePoll(): void {
    const optionType = this.optionType();
    if (optionType === undefined || !this.isValid()) {
      return;
    }

    if (optionType === OptionType.Date) {
      const options = this.dateOptions()
        .filter((o) => isDateOptionEntryValid(o))
        .map((o) => ({
          text: serializeDateOption(o),
          description: '',
        }));

      this.projectListStore.addStandalonePoll({
        name: this.question(),
        description: this.description(),
        optionType: OptionType.Date,
        closeDate: this.closeDate(),
        options,
      });
    } else {
      const options = this.options()
        .filter((o) => !!o.text)
        .map((o) => ({
          text: o.text,
          description: o.description,
          meta: o.meta,
        }));

      this.projectListStore.addStandalonePoll({
        name: this.question(),
        description: this.description(),
        optionType,
        closeDate: this.closeDate(),
        options,
      });
    }
  }

  private editPoll(): void {
    const projectId = this.projectId();
    const pollId = this.pollId();
    const optionType = this.optionType();
    if (!projectId || !pollId || optionType === undefined || !this.isValid()) {
      return;
    }

    if (optionType === OptionType.Date) {
      const options = this.dateOptions()
        .filter((o) => isDateOptionEntryValid(o))
        .map((o) => ({
          id: o.id,
          text: serializeDateOption(o),
          description: '',
        }));

      this.projectDetailStore.editPoll({
        projectId,
        pollId,
        name: this.question(),
        description: this.description(),
        closeDate: this.closeDate(),
        options,
        removedOptionIds: this.removedOptionIds(),
      });
    } else {
      const options = this.options()
        .filter((o) => !!o.text)
        .map((o) => ({
          id: o.id,
          text: o.text,
          description: o.description,
          meta: o.meta,
        }));

      this.projectDetailStore.editPoll({
        projectId,
        pollId,
        name: this.question(),
        description: this.description(),
        closeDate: this.closeDate(),
        options,
        removedOptionIds: this.removedOptionIds(),
      });
    }
  }
}
