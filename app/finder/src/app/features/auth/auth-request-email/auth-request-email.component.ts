import { Component, effect, inject } from '@angular/core';
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

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor(router: Router) {
    effect(() => {
      if (this.userStore.loginRequestEmailWasSent()) {
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
