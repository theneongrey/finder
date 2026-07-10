import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressSpinner } from 'primeng/progressspinner';
import { UserService } from '../../../common/services/user.service';
import { UserStore } from '../../../common/data/user.store';
import { ProjectStore } from '../_shared/data/project.store';

@Component({
  selector: 'app-public-project',
  standalone: true,
  imports: [ProgressSpinner],
  template: `
    <div class="flex items-center justify-center h-screen">
      <p-progress-spinner />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicProjectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly userStore = inject(UserStore);
  private readonly projectStore = inject(ProjectStore);

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('projectId')!;

    this.userService.getUser().subscribe((user) => {
      if (user?.isAuthenticated) {
        this.projectStore.navigateToSharedProject(projectId);
      } else {
        this.userStore.setRedirectUrl(`/p/${projectId}`);
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
