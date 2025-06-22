import { Component, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProjectStore } from '../../_data/project.store';
import { RouterLink } from '@angular/router';
import { DataView } from 'primeng/dataview';
import { ProjectRoleToNamePipe } from '../../_utils/pipe/permission-to-name.pipe';

@Component({
  selector: 'app-project-overview-project-list',
  imports: [
    Button,
    DataView,
    ConfirmDialogModule,
    RouterLink,
    ProjectRoleToNamePipe,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './project-overview-project-list.component.html',
  styleUrl: './project-overview-project-list.component.css',
})
export class ProjectOverviewProjectListComponent {
  private projectStore = inject(ProjectStore);
  private confirmationService = inject(ConfirmationService);

  projects = this.projectStore.projects;

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

  deleteProject(id: string) {
    this.projectStore.deleteProject(id);
  }
}
