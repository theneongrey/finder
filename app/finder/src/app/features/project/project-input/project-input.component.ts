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

@Component({
  selector: 'app-project-add-project',
  templateUrl: './project-input.component.html',
  styleUrl: './project-input.component.css',
  imports: [FormsModule, InputText, Button, Textarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectInputComponent {
  private readonly projectStore = inject(ProjectStore);

  mode = input<'add' | 'edit'>('add');
  id = input<string>();

  projectName = model('');
  projectDescription = model('');

  constructor() {
    const titleService: TitleService = inject(TitleService);
    titleService.setBackroute('/project/');
    titleService.setTitle('Create Project');

    effect(() => {
      const projectId = this.id();
      if (this.mode() === 'edit' && projectId) {
        titleService.setTitle('Update Project');
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
