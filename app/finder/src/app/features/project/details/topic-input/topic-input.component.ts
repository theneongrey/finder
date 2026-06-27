import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { ProjectStore } from '../../_data/project.store';
import { OptionType } from '../../_models/project-detail.model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  TopicOptionsYesNoComponent,
  OptionEntry,
} from './topic-options-yes-no/topic-options-yes-no.component';
import {
  TopicOptionsDateComponent,
  DateOptionEntry,
} from './topic-options-date/topic-options-date.component';
import { TitleBarService } from '../../../../common/services/title-bar.service';
import { AutoResizeTextareaComponent } from '../../../../common/ui/components/auto-resize-textarea/auto-resize-textarea.component';
import { ActivatedRoute } from '@angular/router';

export type { OptionEntry, DateOptionEntry };

@Component({
  selector: 'app-topic-input',
  templateUrl: './topic-input.component.html',
  imports: [
    FormsModule,
    InputText,
    Button,
    AutoResizeTextareaComponent,
    TranslatePipe,
    TopicOptionsYesNoComponent,
    TopicOptionsDateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicInputComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly translateService = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  readonly OptionType = OptionType;

  mode = input<'add' | 'edit'>('add');
  projectId = this.projectStore.projectId;
  topicId = input<string | undefined>(undefined);

  optionType = signal<OptionType>(
    this.route.snapshot.data['optionType'] ?? OptionType.YesNo,
  );

  question = signal('');
  description = signal('');
  options = signal<OptionEntry[]>([{ text: '', description: '', url: '' }]);
  dateOptions = signal<DateOptionEntry[]>([{ startDate: null, endDate: null }]);
  removedOptionIds = signal<string[]>([]);

  constructor() {
    const titleService = inject(TitleBarService);

    const createYesNoTitle = this.translateService.translate(
      'project.topicInput.yesNo.createPoll',
    );
    const updateYesNoTitle = this.translateService.translate(
      'project.topicInput.yesNo.updatePoll',
    );
    const createDateTitle = this.translateService.translate(
      'project.topicInput.date.createPoll',
    );
    const updateDateTitle = this.translateService.translate(
      'project.topicInput.date.updatePoll',
    );

    effect(() => {
      const isDate = this.optionType() === OptionType.Date;
      if (this.mode() === 'edit') {
        titleService.setTitle(isDate ? updateDateTitle() : updateYesNoTitle());
      } else {
        titleService.setTitle(isDate ? createDateTitle() : createYesNoTitle());
      }
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
                    endDate:
                      parts[1] ? new Date(parseInt(parts[1])) : null,
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
    if (this.optionType() === OptionType.Date) {
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
    if (this.optionType() === OptionType.Date) {
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
    if (this.optionType() === OptionType.Date) {
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
    if (!projectId || !this.isValid()) {
      return;
    }

    if (this.optionType() === OptionType.Date) {
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
        optionType: OptionType.YesNo,
        options,
      });
    }
  }

  private editTopic(): void {
    const projectId = this.projectId();
    const topicId = this.topicId();
    if (!projectId || !topicId || !this.isValid()) {
      return;
    }

    if (this.optionType() === OptionType.Date) {
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
