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
import { AutoResizeTextareaComponent } from '../../../common/ui/components/auto-resize-textarea/auto-resize-textarea.component';
import { TitleService } from '../../../common/services/title.service';
import { AddCardComponent } from '../../../common/ui/components/add-card/add-card.component';
import { SideColorCardComponent } from '../../../common/ui/components/side-color-card/side-color-card.component';
import { ProjectStore } from '../_data/project.store';
import { OptionType } from '../_models/project-detail.model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

interface OptionEntry {
  id?: string;
  text: string;
  description: string;
  url: string;
}

@Component({
  selector: 'app-topic-input-yes-no',
  templateUrl: './topic-input-yes-no.component.html',
  styleUrl: './topic-input-yes-no.component.css',
  imports: [
    FormsModule,
    InputText,
    Button,
    AutoResizeTextareaComponent,
    AddCardComponent,
    SideColorCardComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicInputYesNoComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly translateService = inject(TranslateService);

  mode = input<'add' | 'edit'>('add');
  projectId = input<string | undefined>(undefined);
  topicId = input<string | undefined>(undefined);

  question = signal('');
  description = signal('');
  options = signal<OptionEntry[]>([
    { text: '', description: '', url: '' },
  ]);
  removedOptionIds = signal<string[]>([]);

  constructor() {
    const titleService = inject(TitleService);

    const createTitle = this.translateService.translate(
      'project.topicInput.yesNo.createPoll',
    );
    const updateTitle = this.translateService.translate(
      'project.topicInput.yesNo.updatePoll',
    );
    effect(() => {
      titleService.setTitle(
        this.mode() === 'edit' ? updateTitle() : createTitle(),
      );
    });

    effect(() => {
      const projectId = this.projectId();
      if (projectId) {
        titleService.setBackroute(`/project/detail/${projectId}`);
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
    });
  }

  isValid(): boolean {
    return (
      !!this.question() && this.options().filter((o) => !!o.text).length >= 1
    );
  }

  addOption(): void {
    this.options.update((opts) => [
      ...opts,
      { text: '', description: '', url: '' },
    ]);
  }

  removeOption(index: number): void {
    const removedOption = this.options()[index];
    if (removedOption?.id) {
      this.removedOptionIds.update((ids) => [...ids, removedOption.id!]);
    }
    this.options.update((opts) => opts.filter((_, i) => i !== index));
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

  private editTopic(): void {
    const projectId = this.projectId();
    const topicId = this.topicId();
    if (!projectId || !topicId || !this.isValid()) {
      return;
    }

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
