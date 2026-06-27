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
import { HierarchyByTypePipe } from '../_pipe/hierarchy-by-type.pipe';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { TypeIconComponent } from '../type-icon/type-icon.component';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { OptionType, Topic } from '../../../_models/project-detail.model';
import { SideColorCardComponent } from '../../../../../common/ui/components/side-color-card/side-color-card.component';

@Component({
  selector: 'app-project-detail-item',
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
  templateUrl: './project-detail-item.component.html',
  styleUrl: './project-detail-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailItemComponent {
  private readonly translateService = inject(TranslateService);

  projectId = input.required<string>();
  topic = input.required<Topic>();
  deletionRequested = output();

  private editLabel = this.translateService.translate('project.common.edit');
  private deleteLabel = this.translateService.translate(
    'project.common.delete',
  );

  menuItems = computed<MenuItem[]>(() => [
    {
      label: this.editLabel(),
      icon: 'fa-solid fa-pen',
      routerLink:
        this.topic().optionType === OptionType.YesNo
          ? [
              '/project/detail',
              this.projectId(),
              'topic',
              'edit',
              'yesno',
              this.topic().id,
            ]
          : this.topic().optionType === OptionType.Date
            ? [
                '/project/detail',
                this.projectId(),
                'topic',
                'edit',
                'date',
                this.topic().id,
              ]
            : undefined,
    },
    {
      label: this.deleteLabel(),
      icon: 'fa-regular fa-trash-can',
      command: () => this.deletionRequested.emit(),
    },
  ]);
}
