import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { TitleBarComponent } from '@smart/title-bar/title-bar.component';
import { Router, RouterOutlet } from '@angular/router';
import { MaxHeightMinusHeaderDirective } from '../../../common/ui/directives/max-height-minus-header.directive';
import { PollDetailStore } from '../_shared/data/poll-detail.store';

@Component({
  selector: 'app-poll-detail-shell',
  imports: [TitleBarComponent, RouterOutlet, MaxHeightMinusHeaderDirective],
  templateUrl: './detail-shell.component.html',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollDetailShellComponent {
  private readonly projectDetailStore = inject(PollDetailStore);
  private readonly router = inject(Router);
  id = input<string>();

  constructor() {
    effect(() => {
      const projectId = this.id();
      if (projectId) {
        this.projectDetailStore.getProject(projectId);
      }
    });

    effect(() => {
      const project = this.projectDetailStore.currentProject();
      if (project && this.id() !== project.id) {
        this.router.navigate(['/polls', project.id], { replaceUrl: true });
      }
    });
  }
}
