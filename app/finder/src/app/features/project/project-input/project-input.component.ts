import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { ProjectStore } from '../_data/project.store';
import { Textarea } from 'primeng/textarea';
import { TitleService } from '../../../common/services/title.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-project-add-project',
  templateUrl: './project-input.component.html',
  styleUrl: './project-input.component.css',
  imports: [FormsModule, InputText, Button, Textarea, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectInputComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly translateService = inject(TranslateService);

  mode = input<'add' | 'edit'>('add');
  id = input<string>();

  projectName = model('');
  projectDescription = model('');

  constructor() {
    const titleService: TitleService = inject(TitleService);
    titleService.setBackroute('/project/');

    const createTitle = this.translateService.translate('project.input.create');
    const updateTitle = this.translateService.translate('project.input.update');

    effect(() => {
      titleService.setTitle(
        this.mode() === 'edit' ? updateTitle() : createTitle(),
      );
    });

    effect(() => {
      const projectId = this.id();
      if (this.mode() === 'edit' && projectId) {
        this.projectStore.getProject(projectId);
      }
    });

    effect(() => {
      const currentProject = this.projectStore.currentProject();
      if (
        this.mode() === 'edit' &&
        currentProject &&
        currentProject.id === this.id()
      ) {
        this.projectName.set(currentProject.name);
        this.projectDescription.set(currentProject.description);
      }
    });
  }
  submit() {
    if (this.mode() === 'add') {
      this.addProject();
    } else if (this.mode() === 'edit') {
      this.editProject();
    }
  }

  private addProject() {
    if (this.projectName()) {
      this.projectStore.addProject({
        name: this.projectName(),
        description: this.projectDescription(),
      });
    }
  }

  private editProject() {
    const id = this.id();
    if (id && this.projectName()) {
      this.projectStore.editProject({
        id,
        name: this.projectName(),
        description: this.projectDescription(),
      });
    }
  }
}
