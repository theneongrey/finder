import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { Topic } from '../../_models/project-detail.model';
import { Button } from 'primeng/button';
import { HierarchyByTypePipe } from '../_pipe/hierarchy-by-type.pipe';
import { Menu } from 'primeng/menu';
import { SideColorCardComponent } from '../../../../common/ui/components/side-color-card/side-color-card.component';
import { TypeIconComponent } from '../type-icon/type-icon.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-project-detail-item',
  imports: [
    Button,
    HierarchyByTypePipe,
    Menu,
    SideColorCardComponent,
    TypeIconComponent,
    RouterLink,
  ],
  templateUrl: './project-detail-item.component.html',
  styleUrl: './project-detail-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailItemComponent {
  projectId = input.required<string>();
  topic = input.required<Topic>();
  deletionRequested = output();

  menuItems = [
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
}
