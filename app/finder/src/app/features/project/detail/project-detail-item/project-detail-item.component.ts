import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { OptionType, Topic } from '../../_models/project-detail.model';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import { HierarchyByTypePipe } from '../_pipe/hierarchy-by-type.pipe';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { SideColorCardComponent } from '../../../../common/ui/components/side-color-card/side-color-card.component';
import { TypeIconComponent } from '../type-icon/type-icon.component';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

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
  private readonly router = inject(Router);

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
      icon: 'pi pi-pencil',
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
          : undefined,
    },
    {
      label: this.deleteLabel(),
      icon: 'pi pi-trash',
      command: () => this.deletionRequested.emit(),
    },
  ]);
}
