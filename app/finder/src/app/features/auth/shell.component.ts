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
import { DsIconComponent } from '../../common/ui/ds-components/icon/ds-icon.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-shell',
  imports: [RouterOutlet, RouterLink, NgOptimizedImage, DsButtonComponent, DsIconComponent, TranslatePipe],
  templateUrl: './shell.component.html',
  host: { class: 'flex flex-col h-full lg:h-dvh bg-app-gradient' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShellComponent {
  readonly features = [
    'auth.shell.feature1',
    'auth.shell.feature2',
    'auth.shell.feature3',
  ];
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

        const target = untracked((): string => {
          if (!user.name) {
            this.loggerService.log('first time user. redirect to set name');
            return '/settings';
          }
          const redirectUrl = this.userStore.redirectUrl();
          if (redirectUrl) {
            this.loggerService.log(`redirect to ${redirectUrl}`);
            this.userStore.setRedirectUrl(undefined);
            return redirectUrl;
          }
          this.loggerService.log('redirect to project overview');
          return '/project';
        });

        router.navigate(['/auth/login-success'], { state: { target } });
      } else {
        router.navigate(['/auth/request-email']);
      }
    });

    this.userStore.getUser();
  }
}
