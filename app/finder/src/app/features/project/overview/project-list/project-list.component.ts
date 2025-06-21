import { Component, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProjectStore } from '../../_data/project.store';
import { RouterLink } from '@angular/router';
import { DataView } from 'primeng/dataview';

@Component({
  selector: 'app-project-list',
  imports: [Button, DataView, ConfirmDialogModule, RouterLink],
  providers: [ConfirmationService, MessageService],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css',
})
export class ProjectListComponent {
  private projectStore = inject(ProjectStore);
  private confirmationService = inject(ConfirmationService);

  projects = this.projectStore.projects;

  showDeleteDialog(event: MouseEvent, id: string, title: string) {
    event.stopPropagation();
    this.confirmationService.confirm({
      header: 'Delete?',
      message: `Are you sure that you want to delete project ${title}?`,
      accept: () => {
        this.deleteProject(id);
      },
    });
  }

  deleteProject(id: string) {
    this.projectStore.deleteProject(id);
  }
}
