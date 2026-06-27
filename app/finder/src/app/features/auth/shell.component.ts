import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { UserStore } from '../../common/data/user.store';
import { Router, RouterOutlet } from '@angular/router';
import { BackgroundAnimationComponent } from '../../common/ui/components/background-animation/background-animation.component';
import { TitleBarComponent } from '../../common/ui/components/title-bar/title-bar.component';
import { MaxHeightMinusHeaderDirective } from '../../common/ui/directives/max-height-minus-header.directive';

@Component({
  selector: 'app-auth-shell',
  imports: [
    RouterOutlet,
    BackgroundAnimationComponent,
    TitleBarComponent,
    MaxHeightMinusHeaderDirective,
  ],
  templateUrl: './shell.component.html',
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
          router.navigate(['/settings']);
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
