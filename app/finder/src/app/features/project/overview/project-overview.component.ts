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
import { Button } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Dialog } from 'primeng/dialog';
import { FooterService } from '../_services/footer.service';
import { Tag } from 'primeng/tag';
import { SideColorCardComponent } from '../../../common/ui/components/side-color-card/side-color-card.component';

@Component({
  selector: 'app-project-overview',
  imports: [
    ConfirmDialogModule,
    RouterLink,
    ScrollPanelModule,
    FormsModule,
    TimeSincePipe,
    Button,
    FloatLabel,
    InputText,
    Dialog,
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
    const footerService = inject(FooterService);

    this.projectStore.getProjects();
    footerService.setButtons([
      {
        icon: 'pi pi-plus',
        action: () => this.displayAddProjectDialog(),
      },
    ]);
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
