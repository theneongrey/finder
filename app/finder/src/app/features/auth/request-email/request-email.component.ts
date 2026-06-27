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
import { Message } from 'primeng/message';
import { Panel } from 'primeng/panel';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { TitleService } from '../../../common/services/title.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-request-email',
  imports: [
    ReactiveFormsModule,
    Message,
    Panel,
    Button,
    InputText,
    InputGroup,
    InputGroupAddon,
    TranslatePipe,
  ],
  templateUrl: './request-email.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'tw:flex tw:items-center tw:justify-center tw:flex-1 tw:w-full tw:px-4 tw:py-8',
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

  errorMessage = computed(() => {
    const state = this.userStore.loginMail.state();
    switch (state) {
      case 'error':
        return this.errorSendingMessage();
      case 'forbidden':
        return this.errorForbiddenMessage();
      default:
        return undefined;
    }
  });

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor() {
    const router = inject(Router);
    inject(TitleService).disableTitle();

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
