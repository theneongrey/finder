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
import { Router } from '@angular/router';
import { TitleService } from '../../../common/services/title.service';
import { AddCardComponent } from '../../../common/ui/components/add-card/add-card.component';
import { SideColorCardComponent } from '../../../common/ui/components/side-color-card/side-color-card.component';
import { ProjectStore } from '../_data/project.store';
import { OptionType } from '../_models/project-detail.model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

interface OptionEntry {
  text: string;
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
    AddCardComponent,
    SideColorCardComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicInputYesNoComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);

  id = input<string>('');

  question = signal('');
  options = signal<OptionEntry[]>([{ text: '', url: '' }]);

  constructor() {
    const titleService = inject(TitleService);

    const title = this.translateService.translate('project.topicInput.yesNo.createPoll');
    effect(() => titleService.setTitle(title()));

    effect(() => {
      const projectId = this.id();
      if (projectId) {
        titleService.setBackroute(`/project/detail/${projectId}`);
      }
    });
  }

  isValid(): boolean {
    return (
      !!this.question() && this.options().filter((o) => !!o.text).length >= 1
    );
  }

  addOption(): void {
    this.options.update((opts) => [...opts, { text: '', url: '' }]);
  }

  removeOption(index: number): void {
    this.options.update((opts) => opts.filter((_, i) => i !== index));
  }

  submit(): void {
    const projectId = this.id();
    if (!projectId || !this.isValid()) {
      return;
    }

    const optionTexts = this.options()
      .filter((o) => !!o.text)
      .map((o) => o.text);

    this.projectStore.addTopic({
      projectId,
      name: this.question(),
      optionType: OptionType.YesNo,
      options: optionTexts,
    });
  }
}
