import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
} from '@angular/core';
import { ProjectStore } from '../_data/project.store';
import { Card } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TimeSincePipe } from './_pipe/time-ago.pipe';
import { RouterLink } from '@angular/router';
import { HideOnSmallDirective } from '../../../common/ui/directives/hide-on-small.directive';
import { MessageService } from 'primeng/api';
import { ShowOnSmallDirective } from '../../../common/ui/directives/show-on-small.directive';
import { Button } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-project-overview',
  imports: [
    ConfirmDialogModule,
    RouterLink,
    ScrollPanelModule,
    Card,
    FormsModule,
    TimeSincePipe,
    HideOnSmallDirective,
    ShowOnSmallDirective,
    Button,
    FloatLabel,
    InputText,
    Dialog,
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
    this.projectStore.getProjects();
  }

  addProject() {
    if (this.projectName()) {
      this.projectStore.addProject(this.projectName());
      this.showAddProjectDialog.set(false);
    }
  }

  displayAddProjectDialog() {
    this.projectName.set('');
    this.showAddProjectDialog.set(true);
  }
}
