import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { UserService } from '../../../common/services/user.service';
import { UserStore } from '../../../common/data/user.store';
import { SharingStore } from '../_shared/data/sharing.store';

@Component({
  selector: 'app-public-project',
  standalone: true,
  imports: [...HlmSpinnerImports],
  templateUrl: 'public-project.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicProjectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly userStore = inject(UserStore);
  private readonly sharingStore = inject(SharingStore);

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('projectId')!;

    this.userService.getUser().subscribe((user) => {
      if (user?.isAuthenticated) {
        this.sharingStore.navigateToSharedProject(projectId);
      } else {
        this.userStore.setRedirectUrl(`/p/${projectId}`);
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
