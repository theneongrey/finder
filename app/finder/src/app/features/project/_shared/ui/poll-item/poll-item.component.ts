import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { OptionType } from '../../models/project-detail.model';
import { Card } from 'primeng/card';
import { OptionTypeIconComponent } from './option-type-icon/option-type-icon.component';
import { PollItem } from '../../models/poll-item.model';

@Component({
  selector: 'app-poll-item',
  imports: [
    Button,
    Tooltip,
    Menu,
    OptionTypeIconComponent,
    RouterLink,
    TranslatePipe,
    Card,
  ],
  templateUrl: './poll-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollItemComponent {
  private readonly translateService = inject(TranslateService);

  poll = input.required<PollItem>();
  standalone = input(false);
  canEdit = input(false);
  deletionRequested = output();
  shareRequested = output();

  private editLabel = this.translateService.translate('project.common.edit');
  private deleteLabel = this.translateService.translate(
    'project.common.delete',
  );
  private shareLabel = this.translateService.translate('project.common.share');

  menuItems = computed<MenuItem[]>(() => {
    const poll = this.poll();
    const items: MenuItem[] = [
      {
        label: this.editLabel(),
        icon: 'fa-solid fa-pen',
        routerLink:
          poll.optionType === OptionType.YesNo
            ? [
                '/project/detail',
                poll.projectId,
                'poll',
                'edit',
                'yesno',
                poll.pollId,
              ]
            : poll.optionType === OptionType.Date
              ? [
                  '/project/detail',
                  poll.projectId,
                  'poll',
                  'edit',
                  'date',
                  poll.pollId,
                ]
              : undefined,
      },
    ];
    if (this.standalone()) {
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
