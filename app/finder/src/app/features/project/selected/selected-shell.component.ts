import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { TitleBarComponent } from '../../../common/ui/components/title-bar/title-bar.component';
import { Router, RouterOutlet } from '@angular/router';
import { MaxHeightMinusHeaderDirective } from '../../../common/ui/directives/max-height-minus-header.directive';
import { ProjectDetailStore } from '../_shared/data/project-detail.store';

@Component({
  selector: 'app-project-selected-shell',
  imports: [TitleBarComponent, RouterOutlet, MaxHeightMinusHeaderDirective],
  templateUrl: './selected-shell.component.html',
  host: { class: 'tw:block tw:h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSelectedShellComponent {
  private readonly projectDetailStore = inject(ProjectDetailStore);
  private readonly router = inject(Router);
  projectId = input<string>();

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      if (projectId) {
        this.projectDetailStore.getProject(projectId);
      }
    });

    effect(() => {
      const project = this.projectDetailStore.currentProject();
      if (project && this.projectId() !== project.id) {
        this.router.navigate(['/project/detail', project.id], { replaceUrl: true });
      }
    });
  }
}
