import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ProjectDetailStore } from '../../data/project-detail.store';
import { ProjectListStore } from '../../data/project-list.store';
import { OptionType } from '../../models/project-detail.model';
import {
  OptionEntry,
  DateOptionEntry,
} from './poll-input-form/poll-input-form.component';
import { UrlValidationService } from '../../../../../common/utils/url-validation.service';
import { TitleBarService } from '../../../../../common/services/title-bar.service';
import { ActivatedRoute } from '@angular/router';
import { PollTypeSelectionComponent } from './poll-type-selection/poll-type-selection.component';
import { PollInputFormComponent } from './poll-input-form/poll-input-form.component';

export type { OptionEntry, DateOptionEntry };

@Component({
  selector: 'app-poll-input',
  templateUrl: './poll-input.component.html',
  host: { class: 'tw:block tw:h-full' },
  imports: [PollTypeSelectionComponent, PollInputFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollInputComponent {
  private readonly projectDetailStore = inject(ProjectDetailStore);
  private readonly projectListStore = inject(ProjectListStore);
  private readonly route = inject(ActivatedRoute);
  private readonly urlValidation = inject(UrlValidationService);

  readonly OptionType = OptionType;

  mode = input<'add' | 'edit' | 'standalone'>('add');
  projectId = this.projectDetailStore.projectId;
  pollId = input<string | undefined>(undefined);

  optionType = signal<OptionType | undefined>(
    this.route.snapshot.data['optionType'],
  );

  question = signal('');
  description = signal('');
  options = signal<OptionEntry[]>([{ text: '', description: '' }]);
  dateOptions = signal<DateOptionEntry[]>([{ startDate: null, endDate: null }]);
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

        if (currentPoll.optionType === OptionType.Date) {
          this.dateOptions.set(
            currentPoll.options.length
              ? currentPoll.options.map((o) => {
                  const parts = o.text.split(';');
                  return {
                    id: o.id,
                    startDate: parts[0] ? new Date(parseInt(parts[0])) : null,
                    endDate: parts[1] ? new Date(parseInt(parts[1])) : null,
                  };
                })
              : [{ startDate: null, endDate: null }],
          );
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
      return (
        !!this.question() &&
        this.dateOptions().filter((o) => !!o.startDate).length >= 1
      );
    }
    const opts = this.options();
    return (
      !!this.question() &&
      opts.filter((o) => !!o.text).length >= 1 &&
      opts.every((o) => !o.meta?.url || this.urlValidation.isValid(o.meta.url))
    );
  }

  addOption(): void {
    const type = this.optionType();
    if (type === OptionType.Date) {
      this.dateOptions.update((opts) => [
        ...opts,
        { startDate: null, endDate: null },
      ]);
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
        .filter((o) => !!o.startDate)
        .map((o) => ({
          text: this.dateEntryToText(o),
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
        .filter((o) => !!o.startDate)
        .map((o) => ({
          text: this.dateEntryToText(o),
          description: '',
        }));

      this.projectListStore.addStandalonePoll({
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

      this.projectListStore.addStandalonePoll({
        name: this.question(),
        description: this.description(),
        optionType,
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
        .filter((o) => !!o.startDate)
        .map((o) => ({
          id: o.id,
          text: this.dateEntryToText(o),
          description: '',
        }));

      this.projectDetailStore.editPoll({
        projectId,
        pollId,
        name: this.question(),
        description: this.description(),
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
        options,
        removedOptionIds: this.removedOptionIds(),
      });
    }
  }

  private dateEntryToText(entry: DateOptionEntry): string {
    const start = entry.startDate!.getTime().toString();
    const end = entry.endDate ? entry.endDate.getTime().toString() : '';
    return end ? `${start};${end}` : start;
  }
}
