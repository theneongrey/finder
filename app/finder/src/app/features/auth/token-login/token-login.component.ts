import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggerService } from '../../../common/services/logger.service';

@Component({
  selector: 'app-auth-token-login',
  imports: [],
  template: `
    <div
      class="flex flex-col items-center justify-center gap-4"
      style="color: var(--text-secondary); font-size: var(--fs-body-sm)"
    >
      <div class="token-login-spinner"></div>
      <span>Anmeldung läuft …</span>
    </div>
  `,
  styles: `
    .token-login-spinner {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid var(--sand-300);
      border-top-color: var(--accent);
      animation: token-spin 0.7s linear infinite;
    }
    @keyframes token-spin {
      to { transform: rotate(360deg); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-1 items-center justify-center',
  },
})
export class TokenLoginComponent {
  constructor() {
    const userStore = inject(UserStore);
    const route = inject(ActivatedRoute);
    const router = inject(Router);
    const loggerService = inject(LoggerService);

    const loginToken = route.snapshot.queryParams['token'];
    const redirecturl = route.snapshot.queryParams['redirecturl'];

    loggerService.log('Login by token with redirectUrl');

    if (!loginToken) {
      router.navigate(['/']);
    }

    if (redirecturl) {
      loggerService.log(`with redirectUrl: ${redirecturl}`);
      userStore.setRedirectUrl(redirecturl);
    }

    userStore.loginByToken(loginToken);
  }
}
