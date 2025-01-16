import { Component, effect, inject, input } from '@angular/core';
import { ProjectStore } from '../_data/project.store';
import { Router } from '@angular/router';
import { ProjectDetailTitleBarComponent } from './title-bar/project-detail-title-bar.component';
import { ProjectDetailTopicListComponent } from './topic-list/project-detail-topic-list.component';

@Component({
  selector: 'app-project-detail',
  imports: [ProjectDetailTitleBarComponent, ProjectDetailTopicListComponent],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css',
})
export class ProjectDetailComponent {
  private projectStore = inject(ProjectStore);
  id = input<string>('');
  action = input<string>('');
  project = this.projectStore.currentProject;

  constructor(router: Router) {
    effect(() => {
      this.projectStore.getProject(this.id());
    });
  }
}
