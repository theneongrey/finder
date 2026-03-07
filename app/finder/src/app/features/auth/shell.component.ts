import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { UserStore } from '../../common/data/user.store';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-shell',
  imports: [RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShellComponent {
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
              router.navigate(['/']);
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
