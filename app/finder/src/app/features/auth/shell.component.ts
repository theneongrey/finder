import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { UserStore } from '../../common/data/user.store';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { LoggerService } from '../../common/services/logger.service';
import { DsButtonComponent } from '../../common/ui/ds-components/button/ds-button.component';

@Component({
  selector: 'app-auth-shell',
  imports: [RouterOutlet, RouterLink, NgOptimizedImage, DsButtonComponent],
  templateUrl: './shell.component.html',
  host: { class: 'flex flex-col h-full lg:h-dvh bg-app-gradient' },
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
