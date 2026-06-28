import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Button } from 'primeng/button';
import { ProjectStore } from '../../_data/project.store';
import { OptionType } from '../../_models/project-detail.model';
import { TranslatePipe } from '@ngx-translate/core';
import {
  OptionEntry,
  DateOptionEntry,
} from './topic-input-form/topic-input-form.component';
import { TitleBarService } from '../../../../common/services/title-bar.service';
import { ActivatedRoute } from '@angular/router';
import { TopicTypeSelectionComponent } from './topic-type-selection/topic-type-selection.component';
import { TopicInputFormComponent } from './topic-input-form/topic-input-form.component';

export type { OptionEntry, DateOptionEntry };

@Component({
  selector: 'app-topic-input',
  templateUrl: './topic-input.component.html',
  host: { class: 'tw:block tw:h-full' },
  imports: [
    Button,
    TranslatePipe,
    TopicTypeSelectionComponent,
    TopicInputFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicInputComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly route = inject(ActivatedRoute);

  readonly OptionType = OptionType;

  mode = input<'add' | 'edit'>('add');
  projectId = this.projectStore.projectId;
  topicId = input<string | undefined>(undefined);

  optionType = signal<OptionType | undefined>(
    this.route.snapshot.data['optionType'],
  );

  question = signal('');
  description = signal('');
  options = signal<OptionEntry[]>([{ text: '', description: '', url: '' }]);
  dateOptions = signal<DateOptionEntry[]>([{ startDate: null, endDate: null }]);
  removedOptionIds = signal<string[]>([]);

  constructor() {
    const titleService = inject(TitleBarService);

    effect(() => {
      titleService.setTitle(this.projectStore.currentProject()?.name ?? '');
    });

    effect(() => {
      const topicId = this.topicId();
      if (this.mode() === 'edit' && topicId) {
        this.projectStore.getTopic(topicId);
      }
    });

    effect(() => {
      const currentTopic = this.projectStore.currentTopic();
      if (
        this.mode() === 'edit' &&
        currentTopic &&
        currentTopic.id === this.topicId()
      ) {
        this.question.set(currentTopic.name);
        this.description.set(currentTopic.description);

        if (currentTopic.optionType === OptionType.Date) {
          this.dateOptions.set(
            currentTopic.options.length
              ? currentTopic.options.map((o) => {
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
            currentTopic.options.length
              ? currentTopic.options.map((o) => ({
                  id: o.id,
                  text: o.text,
                  description: o.description,
                  url: o.url,
                }))
              : [{ text: '', description: '', url: '' }],
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
    return (
      !!this.question() && this.options().filter((o) => !!o.text).length >= 1
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
      this.options.update((opts) => [
        ...opts,
        { text: '', description: '', url: '' },
      ]);
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
      this.addTopic();
    } else if (this.mode() === 'edit') {
      this.editTopic();
    }
  }

  private addTopic(): void {
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
          url: '',
        }));

      this.projectStore.addTopic({
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
          url: o.url,
        }));

      this.projectStore.addTopic({
        projectId,
        name: this.question(),
        description: this.description(),
        optionType,
        options,
      });
    }
  }

  private editTopic(): void {
    const projectId = this.projectId();
    const topicId = this.topicId();
    const optionType = this.optionType();
    if (!projectId || !topicId || optionType === undefined || !this.isValid()) {
      return;
    }

    if (optionType === OptionType.Date) {
      const options = this.dateOptions()
        .filter((o) => !!o.startDate)
        .map((o) => ({
          id: o.id,
          text: this.dateEntryToText(o),
          description: '',
          url: '',
        }));

      this.projectStore.editTopic({
        projectId,
        topicId,
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
          url: o.url,
        }));

      this.projectStore.editTopic({
        projectId,
        topicId,
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
