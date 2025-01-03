import { Component, effect, inject } from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { FloatLabel } from 'primeng/floatlabel';
import { InputOtp } from 'primeng/inputotp';
import { Panel } from 'primeng/panel';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-auth-code-login',
  imports: [ReactiveFormsModule, InputOtp, Panel, Button],
  templateUrl: './code-login.component.html',
  styleUrl: './code-login.component.css',
})
export class CodeLoginComponent {
  private userStore = inject(UserStore);

  form = new FormGroup({
    code: new FormControl('', [Validators.required]),
  });

  constructor(router: Router) {
    if (!this.userStore.loginMail.email()) {
      console.log('redirect: no email stored');
      router.navigate(['/']);
    }

    effect(() => {
      if (this.userStore.user()?.isAuthenticated) {
        console.log('redirect: user is authenticated');
        router.navigate(['/']);
      }
    });
  }

  verifyCode() {
    const code = this.form.get('code')!.value!;

    if (this.form.valid && code.length === 6) {
      this.userStore.loginByCode(code);
    }
  }
}
