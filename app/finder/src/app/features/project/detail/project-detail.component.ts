import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { ProjectStore } from '../_data/project.store';
import { ProjectDetailTitleBarComponent } from './title-bar/project-detail-title-bar.component';
import { ProjectDetailTopicListComponent } from './topic-list/project-detail-topic-list.component';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-project-detail',
  imports: [
    ProjectDetailTitleBarComponent,
    ProjectDetailTopicListComponent,
    ConfirmDialog,
  ],
  providers: [ConfirmationService],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent {
  private projectStore = inject(ProjectStore);
  private confirmationService = inject(ConfirmationService);

  id = input('');
  action = input('');
  project = this.projectStore.currentProject;

  constructor() {
    effect(() => {
      this.projectStore.getProject(this.id());
    });
  }

  deleteProject(id: string) {
    this.projectStore.deleteProject(id);
  }

  showDeleteDialog(event: MouseEvent, id: string, title: string) {
    event.stopPropagation();
    this.confirmationService.confirm({
      header: 'Delete?',
      message: `Are you sure that you want to delete project "${title}?"`,
      accept: () => {
        this.deleteProject(id);
      },
    });
  }
}
