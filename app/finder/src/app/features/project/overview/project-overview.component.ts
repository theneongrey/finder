import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
} from '@angular/core';
import { ProjectStore } from '../_data/project.store';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { TitleService } from '../../../common/services/title.service';
import { ProjectItemComponent } from './project-item/project-item.component';
import { ProjectOverview } from '../_models/project-overview.model';

@Component({
  selector: 'app-project-overview',
  imports: [
    ConfirmDialogModule,
    RouterLink,
    ScrollPanelModule,
    FormsModule,
    Button,
    ProjectItemComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './project-overview.component.html',
  styleUrl: './project-overview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tw:h-full tw:max-h-full',
  },
})
export class ProjectOverviewComponent {
  private projectStore = inject(ProjectStore);
  private readonly confirmationService = inject(ConfirmationService);

  projects = this.projectStore.projects;

  showAddProjectDialog = model(false);
  projectName = model('');

  constructor() {
    inject(TitleService).setTitle('Finder');
    this.projectStore.getProjects();
  }

  deletionRequested(project: ProjectOverview) {
    this.confirmationService.confirm({
      header: 'Delete project?',
      message: `Are you sure that you want to delete project "${project.name}"?"`,
      acceptLabel: 'Delete project',
      rejectLabel: 'Cancel',
      accept: () => {
        this.deleteProject(project.id);
      },
    });
  }

  private deleteProject(projectId: string) {
    this.projectStore.deleteProject(projectId);
  }
}
