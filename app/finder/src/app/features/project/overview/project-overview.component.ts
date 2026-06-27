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
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-project-overview',
  imports: [
    ConfirmDialogModule,
    ProjectItemComponent,
    AddCardComponent,
    TranslatePipe,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './project-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tw:h-full tw:max-h-full',
  },
})
export class ProjectOverviewComponent {
  private projectStore = inject(ProjectStore);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);

  projects = this.projectStore.projects;

  constructor() {
    inject(TitleService).setTitle('votean');
    this.projectStore.getProjects();
  }

  navigateToAdd() {
    this.router.navigate(['/project/add']);
  }

  deletionRequested(project: ProjectOverview) {
    this.confirmationService.confirm({
      header: this.translateService.instant('project.overview.deleteConfirm.header'),
      message: this.translateService.instant('project.overview.deleteConfirm.message', {
        name: project.name,
      }),
      acceptLabel: this.translateService.instant('project.overview.deleteConfirm.accept'),
      rejectLabel: this.translateService.instant('project.common.cancel'),
      accept: () => {
        this.deleteProject(project.id);
      },
    });
  }

  private deleteProject(projectId: string) {
    this.projectStore.deleteProject(projectId);
  }
}
