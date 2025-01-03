import { Component, inject } from '@angular/core';
import { ProjectListTitleBarComponent } from './title-bar/project-list-title-bar.component';
import { ProjectListComponent } from './project-list/project-list.component';
import { ProjectStore } from '../_data/project.store';

@Component({
  selector: 'app-project-overview',
  imports: [ProjectListTitleBarComponent, ProjectListComponent],
  templateUrl: './project-overview.component.html',
  styleUrl: './project-overview.component.css',
})
export class ProjectOverviewComponent {
  private projectStore = inject(ProjectStore);
  projects = this.projectStore.projects;

  constructor() {
    this.projectStore.getProjects();
  }
}
