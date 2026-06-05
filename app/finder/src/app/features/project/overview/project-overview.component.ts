import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
} from '@angular/core';
import { ProjectStore } from '../_data/project.store';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TimeSincePipe } from './_pipe/time-ago.pipe';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { SideColorCardComponent } from '../../../common/ui/components/side-color-card/side-color-card.component';
import { TitleService } from '../../../common/services/title.service';

@Component({
  selector: 'app-project-overview',
  imports: [
    ConfirmDialogModule,
    RouterLink,
    ScrollPanelModule,
    FormsModule,
    TimeSincePipe,
    Button,
    Tag,
    SideColorCardComponent,
  ],
  providers: [MessageService],
  templateUrl: './project-overview.component.html',
  styleUrl: './project-overview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tw:h-full tw:max-h-full',
  },
})
export class ProjectOverviewComponent {
  private projectStore = inject(ProjectStore);

  projects = this.projectStore.projects;

  showAddProjectDialog = model(false);
  projectName = model('');

  constructor() {
    inject(TitleService).setTitle('Finder');
    this.projectStore.getProjects();
  }
}
