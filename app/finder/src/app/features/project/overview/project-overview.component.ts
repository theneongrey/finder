import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { ProjectStore } from '../_data/project.store';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TitleService } from '../../../common/services/title.service';
import { ProjectItemComponent } from './project-item/project-item.component';
import { ProjectOverview } from '../_models/project-overview.model';
import { AddCardComponent } from '../../../common/ui/components/add-card/add-card.component';

@Component({
  selector: 'app-project-overview',
  imports: [
    ConfirmDialogModule,
    ProjectItemComponent,
    AddCardComponent,
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
  private readonly router = inject(Router);

  projects = this.projectStore.projects;

  constructor() {
    inject(TitleService).setTitle('Finder');
    this.projectStore.getProjects();
  }

  navigateToAdd() {
    this.router.navigate(['/project/add']);
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
