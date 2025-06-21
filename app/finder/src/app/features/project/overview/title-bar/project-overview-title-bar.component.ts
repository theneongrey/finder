import { Component, inject, model } from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { ProjectStore } from '../../_data/project.store';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-overview-title-bar',
  imports: [Button, Dialog, InputText, FormsModule],
  templateUrl: './project-overview-title-bar.component.html',
  styleUrl: './project-overview-title-bar.component.css',
})
export class ProjectOverviewTitleBarComponent {
  private projectStore = inject(ProjectStore);

  showDialog = model(false);
  projectName = model('');

  addProject() {
    if (this.projectName()) {
      this.projectStore.addProject(this.projectName());
      this.showDialog.set(false);
    }
  }

  displayDialog() {
    this.projectName.set('');
    this.showDialog.set(true);
  }
}
