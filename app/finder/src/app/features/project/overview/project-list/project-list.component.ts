import { Component, inject, input } from '@angular/core';
import { Project } from '../../_models/project.model';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProjectStore } from '../../_data/project.store';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-project-list',
  imports: [Button, Toast, ConfirmDialogModule, RouterLink],
  providers: [ConfirmationService, MessageService],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css',
})
export class ProjectListComponent {
  private projectStore = inject(ProjectStore);
  projects = this.projectStore.projects;

  constructor(private confirmationService: ConfirmationService) {}

  deleteProject(id: string) {
    this.projectStore.deleteProject(id);
  }

  confirm(id: string, title: string) {
    this.confirmationService.confirm({
      header: 'Delete?',
      message: `Are you sure that you want to delete project ${title}?`,
      accept: () => {
        this.deleteProject(id);
      },
    });
  }
}
