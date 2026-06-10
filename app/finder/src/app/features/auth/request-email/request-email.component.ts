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
  ],
  templateUrl: './request-email.component.html',
  styleUrl: './request-email.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'tw:flex tw:items-center tw:justify-center tw:flex-1 tw:w-full tw:px-4 tw:py-8',
  },
})
export class RequestEmailComponent {
  private userStore = inject(UserStore);

  isLoading = computed(() => this.userStore.loginMail.state() === 'sent');

  errorMessage = computed(() => {
    const state = this.userStore.loginMail.state();
    switch (state) {
      case 'error':
        return 'Error while sending the mail. Please check your email and try again.';
      case 'forbidden':
        return 'This email is not allowed. Please contact the admin for an invitation.';
      default:
        return undefined;
    }
  });

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor() {
    const router = inject(Router);
    const titleService = inject(TitleService);

    titleService.setTitle('');
    titleService.setBackroute('/');

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
