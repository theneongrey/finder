import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProjectStore } from '../_data/project.store';
import { ProjectOverviewProjectListComponent } from './project-list/project-overview-project-list.component';

@Component({
  selector: 'app-project-overview',
  imports: [ProjectOverviewProjectListComponent],
  templateUrl: './project-overview.component.html',
  styleUrl: './project-overview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectOverviewComponent {
  private projectStore = inject(ProjectStore);

  constructor() {
    this.projectStore.getProjects();
  }
}
