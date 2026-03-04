import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Topic } from '../../_models/project-detail.model';
import { DataView } from 'primeng/dataview';
import { ProjectStore } from '../../_data/project.store';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-project-topic-option-list',
  imports: [FormsModule, DataView, Button, ConfirmDialog, RouterLink],
  providers: [ConfirmationService, MessageService],
  templateUrl: './project-topic-option-list.component.html',
  styleUrl: './project-topic-option-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTopicOptionListComponent {
  private projectStore = inject(ProjectStore);
  private confirmationService = inject(ConfirmationService);

  topic = input<Topic>();
  projectId = input<string>();
  options = computed(() => this.topic()?.options);

  showDeleteDialog(event: MouseEvent, id: string, title: string) {
    event.stopPropagation();
    this.confirmationService.confirm({
      header: 'Delete?',
      message: `Are you sure that you want to delete the option "${title}?"`,
      accept: () => {
        this.deleteOption(id);
      },
    });
  }

  deleteOption(id: string) {
    this.projectStore.deleteOption(id);
  }
}
