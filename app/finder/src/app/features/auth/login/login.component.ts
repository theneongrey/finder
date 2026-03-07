import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tw:m-auto',
  },
})
export class LoginComponent {
  private userStore = inject(UserStore);

  constructor() {
    const router = inject(Router);

    effect(() => {
      const user = this.userStore.user();
      if (!user) {
        return;
      }

      if (user.isAuthenticated) {
        if (!user.name) {
          router.navigate(['/settings/set-name']);
        } else {
          untracked(() => {
            const redirectUrl = this.userStore.redirectUrl();
            if (redirectUrl) {
              this.userStore.setRedirectUrl(undefined);
              router.navigate([redirectUrl]);
            } else {
              router.navigate(['/logged-in']);
            }
          });
        }
      } else {
        router.navigate(['/auth/request-email']);
      }
    });

    this.userStore.getUser();
  }
}
