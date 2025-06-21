import { Component, inject } from '@angular/core';
import { ProjectOverviewTitleBarComponent } from './title-bar/project-overview-title-bar.component';
import { ProjectStore } from '../_data/project.store';
import { ProjectOverviewProjectListComponent } from './project-list/project-overview-project-list.component';

@Component({
  selector: 'app-project-overview',
  imports: [
    ProjectOverviewTitleBarComponent,
    ProjectOverviewProjectListComponent,
  ],
  templateUrl: './project-overview.component.html',
  styleUrl: './project-overview.component.css',
})
export class ProjectOverviewComponent {
  private projectStore = inject(ProjectStore);

  constructor() {
    this.projectStore.getProjects();
  }
}
