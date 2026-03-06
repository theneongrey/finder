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
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { Panel } from 'primeng/panel';

@Component({
  selector: 'app-auth-request-email',
  imports: [ReactiveFormsModule, InputText, Button, FloatLabel, Panel],
  templateUrl: './auth-request-email.component.html',
  styleUrl: './auth-request-email.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tw:m-auto',
  },
})
export class AuthRequestEmailComponent {
  private userStore = inject(UserStore);
  errorMessage = computed(() => {
    const loginMailState = this.userStore.loginMail.state();
    switch (loginMailState) {
      case 'error':
        return 'Error while sending the mail. Please check your mail and try again.';
      case 'forbidden':
        return 'The given email is not allowed. Please contact the admin for an invitation.';
      default:
        return undefined;
    }
  });

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor() {
    const router = inject(Router);

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
