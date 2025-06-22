import { Component, computed, effect, inject, input } from '@angular/core';
import { ProjectStore } from '../_data/project.store';
import { Router } from '@angular/router';
import { ProjectTopicTitleBarComponent } from './title-bar/project-topic-title-bar.component';
import { ProjectTopicOptionListComponent } from './option-list/project-topic-option-list.component';

@Component({
  selector: 'app-project-topic',
  templateUrl: './project-topic.component.html',
  styleUrl: './project-topic.component.css',
  imports: [ProjectTopicTitleBarComponent, ProjectTopicOptionListComponent],
})
export class ProjectTopicComponent {
  private projectStore = inject(ProjectStore);
  id = input('');
  topicId = input('');
  action = input('');
  project = this.projectStore.currentProject;
  topic = computed(() =>
    this.project()?.topics.find((t) => t.id === this.topicId()),
  );

  constructor(router: Router) {
    effect(() => {
      this.projectStore.getProject(this.id());
    });
  }
}
