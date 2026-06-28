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
import { SideColorCardComponent } from '../../../common/ui/components/side-color-card/side-color-card.component';
import { HierarchyByTypePipe } from '../details/detail/_pipe/hierarchy-by-type.pipe';
import { TypeIconComponent } from '../details/detail/type-icon/type-icon.component';
import { OptionType } from '../_models/project-detail.model';
import { TopicItem } from './topic-item.model';

@Component({
  selector: 'app-topic-item',
  imports: [
    Button,
    Tooltip,
    HierarchyByTypePipe,
    Menu,
    SideColorCardComponent,
    TypeIconComponent,
    RouterLink,
    TranslatePipe,
  ],
  templateUrl: './topic-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicItemComponent {
  private readonly translateService = inject(TranslateService);

  topic = input.required<TopicItem>();
  deletionRequested = output();

  private editLabel = this.translateService.translate('project.common.edit');
  private deleteLabel = this.translateService.translate(
    'project.common.delete',
  );

  menuItems = computed<MenuItem[]>(() => {
    const topic = this.topic();
    return [
      {
        label: this.editLabel(),
        icon: 'fa-solid fa-pen',
        routerLink:
          topic.optionType === OptionType.YesNo
            ? [
                '/project/detail',
                topic.projectId,
                'topic',
                'edit',
                'yesno',
                topic.topicId,
              ]
            : topic.optionType === OptionType.Date
              ? [
                  '/project/detail',
                  topic.projectId,
                  'topic',
                  'edit',
                  'date',
                  topic.topicId,
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
