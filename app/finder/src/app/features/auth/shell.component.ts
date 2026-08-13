import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { UserStore } from '../../common/data/user.store';
import { Router, RouterOutlet } from '@angular/router';
import { TitleBarComponent } from '@smart/title-bar/title-bar.component';
import { LoggerService } from '../../common/services/logger.service';

@Component({
  selector: 'app-auth-shell',
  imports: [RouterOutlet, TitleBarComponent],
  templateUrl: './shell.component.html',
  host: { class: 'flex flex-col h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShellComponent {
  private userStore = inject(UserStore);
  private loggerService = inject(LoggerService);

  constructor() {
    const router = inject(Router);

    effect(() => {
      const user = this.userStore.user();
      if (!user) {
        return;
      }

      if (user.isAuthenticated) {
        this.loggerService.log('user is authenticated');

        if (!user.name) {
          this.loggerService.log('first time user. redirect to set name');
          router.navigate(['/settings']);
        } else {
          untracked(() => {
            const redirectUrl = this.userStore.redirectUrl();
            if (redirectUrl) {
              this.loggerService.log(`redirect to ${redirectUrl}`);

              this.userStore.setRedirectUrl(undefined);
              router.navigate([redirectUrl]);
            } else {
              this.loggerService.log(`redirect to project overview`);
              router.navigate(['/project']);
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
