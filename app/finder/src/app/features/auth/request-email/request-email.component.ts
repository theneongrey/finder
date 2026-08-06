import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { TitleBarService } from '../../../common/services/title-bar.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-request-email',
  imports: [
    ReactiveFormsModule,
    ...HlmAlertImports,
    ...HlmCardImports,
    HlmButton,
    HlmInput,
    TranslatePipe,
  ],
  templateUrl: './request-email.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'flex items-center justify-center flex-1 w-full px-4 py-8',
  },
})
export class RequestEmailComponent {
  private userStore = inject(UserStore);
  private translateService = inject(TranslateService);

  isLoading = computed(() => this.userStore.loginMail.state() === 'sent');

  private errorSendingMessage = this.translateService.translate(
    'auth.requestEmail.errorSending',
  );
  private errorForbiddenMessage = this.translateService.translate(
    'auth.requestEmail.errorForbidden',
  );
  private errorRateLimiterMessage = this.translateService.translate(
    'auth.requestEmail.errorRateLimiter',
  );

  errorMessage = computed(() => {
    const state = this.userStore.loginMail.state();
    switch (state) {
      case 'error':
        return this.errorSendingMessage();
      case 'forbidden':
        return this.errorForbiddenMessage();
      case 'rate-limiter':
        return this.errorRateLimiterMessage();
      default:
        return undefined;
    }
  });

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor() {
    const router = inject(Router);
    inject(TitleBarService).disableTitle();

    effect(() => {
      if (
        this.userStore.loginMail.state() === 'finished' &&
        this.userStore.loginMail.email()
      ) {
        router.navigate(['/auth/code-login']);
      }
    });
  }

  sendLoginMail() {
    if (this.form.valid) {
      this.userStore.requestLoginMail(this.form.get('email')!.value!);
    }
  }
}
