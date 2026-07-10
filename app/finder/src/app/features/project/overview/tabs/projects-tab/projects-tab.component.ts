import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ProjectStore } from '../../../_shared/data/project.store';
import { ProjectItemComponent } from '../../project-item/project-item.component';
import { AddCardComponent } from '../../../../../common/ui/components/add-card/add-card.component';
import { ProjectOverview } from '../../../_shared/models/project-overview.model';

@Component({
  selector: 'app-projects-tab',
  imports: [TranslatePipe, ProjectItemComponent, AddCardComponent],
  templateUrl: './projects-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsTabComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly router = inject(Router);

  deletionRequested = output<ProjectOverview>();
  shareRequested = output<string>();

  projects = this.projectStore.projects;

  navigateToAdd() {
    this.router.navigate(['/project/add']);
  }
}
