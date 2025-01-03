import { Component, computed, effect, inject } from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-request-email',
  imports: [ReactiveFormsModule],
  templateUrl: './auth-request-email.component.html',
  styleUrl: './auth-request-email.component.css',
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

  constructor(router: Router) {
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
