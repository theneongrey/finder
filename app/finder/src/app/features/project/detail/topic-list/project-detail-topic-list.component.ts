import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topic } from '../../_models/project-detail.model';
import { DataView } from 'primeng/dataview';
import { ProjectStore } from '../../_data/project.store';
import { Button } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-project-detail-topic-list',
  imports: [FormsModule, DataView, Button, RouterLink, ConfirmDialog],
  providers: [ConfirmationService, MessageService],
  templateUrl: './project-detail-topic-list.component.html',
  styleUrl: './project-detail-topic-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailTopicListComponent {
  private projectStore = inject(ProjectStore);
  private confirmationService = inject(ConfirmationService);

  topics = input.required<Topic[]>();
  project = this.projectStore.currentProject;

  showDeleteDialog(event: MouseEvent, id: string, title: string) {
    event.stopPropagation();
    this.confirmationService.confirm({
      header: 'Delete?',
      message: `Are you sure that you want to delete topic "${title}?"`,
      accept: () => {
        this.deleteTopic(id);
      },
    });
  }

  deleteTopic(id: string) {
    this.projectStore.deleteTopic(id);
  }
}
