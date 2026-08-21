import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggerService } from '../../../common/services/logger.service';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStepIndicatorComponent } from '../_shared/auth-step-indicator.component';

@Component({
  selector: 'app-auth-token-login',
  imports: [TranslatePipe, AuthStepIndicatorComponent],
  templateUrl: './token-login.component.html',
  styleUrl: './token-login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
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
