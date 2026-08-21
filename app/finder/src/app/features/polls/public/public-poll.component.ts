import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../common/services/user.service';
import { UserStore } from '../../../common/data/user.store';
import { SharingStore } from '../_shared/data/sharing.store';
import { DsCardComponent } from '../../../common/ui/ds-components/card/ds-card.component';
import { DsButtonComponent } from '../../../common/ui/ds-components/button/ds-button.component';
import { DsInputComponent } from '../../../common/ui/ds-components/input/ds-input.component';
import { DsPollCardSkeletonComponent } from '../../../common/ui/ds-components/poll-card-skeleton/ds-poll-card-skeleton.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-public-poll',
  standalone: true,
  imports: [
    DsCardComponent,
    DsButtonComponent,
    DsInputComponent,
    DsPollCardSkeletonComponent,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: 'public-poll.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPollComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly userStore = inject(UserStore);
  private readonly sharingStore = inject(SharingStore);

  protected readonly isLoading = signal(true);
  protected readonly emailControl = new FormControl('', Validators.email);

  private projectId = '';

  ngOnInit() {
    this.projectId = this.route.snapshot.paramMap.get('projectId')!;
    this.userStore.setRedirectUrl(`/p/${this.projectId}`);

    this.userService.getUser().subscribe({
      next: (user) => {
        if (user?.isAuthenticated) {
          this.sharingStore.navigateToSharedProject(this.projectId);
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected login(): void {
    const email = this.emailControl.value?.trim() ?? '';
    if (email && this.emailControl.valid) {
      this.router.navigate(['/auth/request-email'], { queryParams: { email } });
    } else {
      this.router.navigate(['/auth/request-email']);
    }
  }

  protected back(): void {
    window.history.back();
  }
}
