import {
  ChangeDetectionStrategy,
  Component,
  effect,
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
  ],
  providers: [MessageService],
  templateUrl: './project-item.component.html',
  styleUrl: './project-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectItemComponent {
  project = input.required<ProjectOverview>();
  deletionRequested = output();

  menuItems: MenuItem[] = [
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => this.deletionRequested.emit(),
    },
  ];

  constructor() {
    effect(() => {
      const project = this.project();
      if (project) {
        this.menuItems[0] = {
          label: 'Edit',
          icon: 'pi pi-pencil',
          routerLink: '/project/edit/' + project.id,
        };
      }
    });
  }
}
