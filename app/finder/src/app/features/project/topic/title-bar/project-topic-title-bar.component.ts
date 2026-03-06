import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { ProjectStore } from '../../_data/project.store';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoggerService } from '../../../../common/services/logger.service';

@Component({
  selector: 'app-project-topic-title-bar',
  imports: [Button, Dialog, InputText, FormsModule, RouterLink],
  templateUrl: './project-topic-title-bar.component.html',
  styleUrl: './project-topic-title-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTopicTitleBarComponent {
  private projectStore = inject(ProjectStore);
  private loggerService = inject(LoggerService);
  project = this.projectStore.currentProject;
  action = input<string | undefined>(undefined);
  topicId = input.required<string>();

  showDialog = model(false);
  option = model('');

  constructor() {
    effect(() => {
      if (this.project() && this.action() == 'add') {
        this.showDialog.set(true);
      }
    });
  }

  addOption() {
    this.loggerService.debug(
      '[ProjectTopicTitleBar] adding new option',
      this.option(),
      this.topicId(),
    );

    if (this.option()) {
      this.projectStore.addOption({
        topicId: this.topicId()!,
        text: this.option(),
      });
      this.showDialog.set(false);
      this.option.set('');
    }
  }

  displayDialog() {
    this.option.set('');
    this.showDialog.set(true);
  }
}
