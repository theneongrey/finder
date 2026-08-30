import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { PollDetailStore } from '../_shared/data/poll-detail.store';

@Component({
  selector: 'app-poll-detail-shell',
  imports: [RouterOutlet],
  templateUrl: './detail-shell.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollDetailShellComponent {
  private readonly projectDetailStore = inject(PollDetailStore);
  private readonly router = inject(Router);

  isFullWidth = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(
        () =>
          this.router.url.includes('/edit/') ||
          this.router.url.includes('/results/') ||
          this.router.url.includes('/vote/'),
      ),
    ),
    { initialValue: false },
  );
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
