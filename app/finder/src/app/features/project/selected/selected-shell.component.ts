import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { TitleBarComponent } from '../../../common/ui/components/title-bar/title-bar.component';
import { RouterOutlet } from '@angular/router';
import { MaxHeightMinusHeaderDirective } from '../../../common/ui/directives/max-height-minus-header.directive';
import { ProjectStore } from '../_shared/data/project.store';

@Component({
  selector: 'app-project-selected-shell',
  imports: [TitleBarComponent, RouterOutlet, MaxHeightMinusHeaderDirective],
  templateUrl: './selected-shell.component.html',
  host: { class: 'tw:block tw:h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSelectedShellComponent {
  private readonly projectStore = inject(ProjectStore);
  projectId = input<string>();

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      if (projectId) {
        this.projectStore.getProject(projectId);
      }
    });
  }
}
