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
import { AutoResizeTextareaComponent } from '../../../common/ui/components/auto-resize-textarea/auto-resize-textarea.component';
import { TitleBarService } from '../../../common/services/title-bar.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProjectStore } from '../_shared/data/project.store';
import { MaxHeightMinusHeaderDirective } from '../../../common/ui/directives/max-height-minus-header.directive';
import { TitleBarComponent } from '../../../common/ui/components/title-bar/title-bar.component';

@Component({
  selector: 'app-project-add-project',
  templateUrl: './project-input.component.html',
  imports: [
    FormsModule,
    InputText,
    Button,
    AutoResizeTextareaComponent,
    TranslatePipe,
    MaxHeightMinusHeaderDirective,
    TitleBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectInputComponent {
  private readonly projectStore = inject(ProjectStore);
  private readonly translateService = inject(TranslateService);

  mode = input<'add' | 'edit'>('add');
  projectId = input<string>();

  projectName = model('');
  projectDescription = model('');

  constructor() {
    const titleService: TitleBarService = inject(TitleBarService);

    const createTitle = this.translateService.translate('project.input.create');
    const updateTitle = this.translateService.translate('project.input.update');

    effect(() => {
      titleService.setTitle(
        this.mode() === 'edit' ? updateTitle() : createTitle(),
      );
    });

    effect(() => {
      const projectId = this.projectId();
      if (this.mode() === 'edit' && projectId) {
        this.projectStore.getProject(projectId);
      }
    });

    effect(() => {
      const currentProject = this.projectStore.currentProject();
      if (
        this.mode() === 'edit' &&
        currentProject &&
        currentProject.id === this.projectId()
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
    const projectId = this.projectId();
    if (projectId && this.projectName()) {
      this.projectStore.editProject({
        id: projectId,
        name: this.projectName(),
        description: this.projectDescription(),
      });
    }
  }
}
