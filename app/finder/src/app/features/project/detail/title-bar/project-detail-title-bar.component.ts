import { Component, effect, inject, input, model } from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { ProjectStore } from '../../_data/project.store';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OptionType } from '../../_models/project-detail.model';

@Component({
  selector: 'app-project-detail-title-bar',
  imports: [Button, Dialog, InputText, FormsModule, RouterLink],
  templateUrl: './project-detail-title-bar.component.html',
  styleUrl: './project-detail-title-bar.component.css',
})
export class ProjectDetailTitleBarComponent {
  private projectStore = inject(ProjectStore);
  project = this.projectStore.currentProject;
  action = input<string | undefined>(undefined);

  showDialog = model(false);
  topic = model('');

  constructor() {
    effect(() => {
      if (this.project() && this.action() == 'add') {
        this.showDialog.set(true);
      }
    });
  }

  addTopic() {
    if (this.topic()) {
      this.projectStore.addTopic({
        projectId: this.project()!.id,
        name: this.topic(),
        options: [
          {
            text: 'Red pill',
            optionType: OptionType.YesNo,
          },
          {
            text: 'Blue pill',
            optionType: OptionType.YesNo,
          },
        ],
      });
      this.showDialog.set(false);
    }
  }
}
