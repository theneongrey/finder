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
import { TypeIconComponent } from '../details/detail/type-icon/type-icon.component';
import { OptionType } from '../_models/project-detail.model';
import { PollItem } from './poll-item.model';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-poll-item',
  imports: [
    Button,
    Tooltip,
    Menu,
    TypeIconComponent,
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
  deletionRequested = output();

  private editLabel = this.translateService.translate('project.common.edit');
  private deleteLabel = this.translateService.translate(
    'project.common.delete',
  );

  menuItems = computed<MenuItem[]>(() => {
    const poll = this.poll();
    return [
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
      {
        label: this.deleteLabel(),
        icon: 'fa-regular fa-trash-can',
        command: () => this.deletionRequested.emit(),
      },
    ];
  });
}
