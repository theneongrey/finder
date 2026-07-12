import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { RouterLink } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { Tag } from 'primeng/tag';
import { TimeSincePipe } from '../_pipe/time-ago.pipe';
import { Button } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectOverview } from '../../_shared/models/project-overview.model';
import { Card } from 'primeng/card';
import { ProjectRole } from '../../_shared/models/project-role.enum';

@Component({
  selector: 'app-project-item',
  imports: [
    ConfirmDialogModule,
    RouterLink,
    ScrollPanelModule,
    FormsModule,
    Tag,
    TimeSincePipe,
    Button,
    Menu,
    TranslatePipe,
    Card,
  ],
  providers: [MessageService],
  templateUrl: './project-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectItemComponent {
  private readonly translateService = inject(TranslateService);

  project = input.required<ProjectOverview>();
  canEdit = computed(() => this.project().role >= ProjectRole.Maintainer);
  canShare = computed(() => this.project().role >= ProjectRole.Owner);
  deletionRequested = output();
  shareRequested = output();

  private editLabel = this.translateService.translate('project.common.edit');
  private deleteLabel = this.translateService.translate(
    'project.common.delete',
  );
  private shareLabel = this.translateService.translate('project.common.share');

  menuItems = computed<MenuItem[]>(() => {
    const project = this.project();
    const items: MenuItem[] = [
      {
        label: this.editLabel(),
        icon: 'fa-solid fa-pen',
        routerLink: '/project/edit/' + project.id,
      },
    ];
    if (this.canShare()) {
      items.push({
        label: this.shareLabel(),
        icon: 'fa-solid fa-share-nodes',
        command: () => this.shareRequested.emit(),
      });
    }
    items.push({
      label: this.deleteLabel(),
      icon: 'fa-regular fa-trash-can',
      command: () => this.deletionRequested.emit(),
    });

    return items;
  });
}
