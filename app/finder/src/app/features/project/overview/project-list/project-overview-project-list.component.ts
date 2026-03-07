import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
} from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProjectStore } from '../../_data/project.store';
import { RouterLink } from '@angular/router';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';

@Component({
  selector: 'app-project-overview-project-list',
  imports: [
    ConfirmDialogModule,
    RouterLink,
    ScrollPanelModule,
    Card,
    Button,
    Dialog,
    InputText,
    FormsModule,
    FloatLabel,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './project-overview-project-list.component.html',
  styleUrl: './project-overview-project-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectOverviewProjectListComponent {
  private projectStore = inject(ProjectStore);
  private confirmationService = inject(ConfirmationService);

  projects = this.projectStore.projects;

  showAddProjectDialog = model(false);
  projectName = model('');

  addProject() {
    if (this.projectName()) {
      this.projectStore.addProject(this.projectName());
      this.showAddProjectDialog.set(false);
    }
  }

  showDeleteDialog(event: MouseEvent, id: string, title: string) {
    event.stopPropagation();
    this.confirmationService.confirm({
      header: 'Delete?',
      message: `Are you sure that you want to delete project "${title}?"`,
      accept: () => {
        this.deleteProject(id);
      },
    });
  }

  displayAddProjectDialog() {
    this.projectName.set('');
    this.showAddProjectDialog.set(true);
  }

  deleteProject(id: string) {
    this.projectStore.deleteProject(id);
  }
}
