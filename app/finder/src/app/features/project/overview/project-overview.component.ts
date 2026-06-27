import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Router, RouterOutlet } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProjectItemComponent } from './project-item/project-item.component';
import { AddCardComponent } from '../../../common/ui/components/add-card/add-card.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectStore } from '../_data/project.store';
import { ProjectOverview } from '../_models/project-overview.model';
import { MaxHeightMinusHeaderDirective } from '../../../common/ui/directives/max-height-minus-header.directive';
import { TitleBarComponent } from '../../../common/ui/components/title-bar/title-bar.component';
import { TitleBarService } from '../../../common/services/title-bar.service';

@Component({
  selector: 'app-project-overview',
  imports: [
    ConfirmDialogModule,
    ProjectItemComponent,
    AddCardComponent,
    TranslatePipe,
    MaxHeightMinusHeaderDirective,
    TitleBarComponent,
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
  private readonly titleBarService = inject(TitleBarService);

  projects = this.projectStore.projects;

  constructor() {
    this.projectStore.getProjects();
    this.titleBarService.clearTitle();
  }

  navigateToAdd() {
    this.router.navigate(['/project/add']);
  }

  deletionRequested(project: ProjectOverview) {
    this.confirmationService.confirm({
      header: this.translateService.instant(
        'project.overview.deleteConfirm.header',
      ),
      message: this.translateService.instant(
        'project.overview.deleteConfirm.message',
        {
          name: project.name,
        },
      ),
      acceptLabel: this.translateService.instant(
        'project.overview.deleteConfirm.accept',
      ),
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
