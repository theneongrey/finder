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
import { ProjectOverview } from '../../_models/project-overview.model';
import { TimeSincePipe } from '../_pipe/time-ago.pipe';
import { SideColorCardComponent } from '../../../../common/ui/components/side-color-card/side-color-card.component';
import { Button } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-project-item',
  imports: [
    ConfirmDialogModule,
    RouterLink,
    ScrollPanelModule,
    FormsModule,
    Tag,
    TimeSincePipe,
    SideColorCardComponent,
    Button,
    Menu,
    TranslatePipe,
  ],
  providers: [MessageService],
  templateUrl: './project-item.component.html',
  styleUrl: './project-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectItemComponent {
  private readonly translateService = inject(TranslateService);

  project = input.required<ProjectOverview>();
  deletionRequested = output();

  private editLabel = this.translateService.translate('project.common.edit');
  private deleteLabel = this.translateService.translate('project.common.delete');

  menuItems = computed<MenuItem[]>(() => {
    const project = this.project();
    return [
      {
        label: this.editLabel(),
        icon: 'pi pi-pencil',
        routerLink: '/project/edit/' + project.id,
      },
      {
        label: this.deleteLabel(),
        icon: 'pi pi-trash',
        command: () => this.deletionRequested.emit(),
      },
    ];
  });
}
