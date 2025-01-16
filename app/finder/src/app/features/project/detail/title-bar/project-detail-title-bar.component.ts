import { Component, effect, inject, input, model } from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { ProjectStore } from '../../_data/project.store';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-detail-title-bar',
  imports: [Button, Dialog, InputText, FormsModule],
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

  addTopic() {}
}
