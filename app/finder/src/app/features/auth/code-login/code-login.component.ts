import {
  ChangeDetectionStrategy,
  Component,
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
import { InputOtp } from 'primeng/inputotp';
import { Panel } from 'primeng/panel';
import { Button } from 'primeng/button';
import { LoggerService } from '../../../common/services/logger.service';

@Component({
  selector: 'app-auth-code-login',
  imports: [ReactiveFormsModule, InputOtp, Panel, Button],
  templateUrl: './code-login.component.html',
  styleUrl: './code-login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'tw:m-auto',
  },
})
export class CodeLoginComponent {
  private userStore = inject(UserStore);
  private loggerService = new LoggerService();

  form = new FormGroup({
    code: new FormControl('', [Validators.required]),
  });

  constructor() {
    const router = inject(Router);

    if (!this.userStore.loginMail.email()) {
      this.loggerService.log('redirect: no email stored');
      void router.navigate(['/']);
    }

    effect(() => {
      if (this.userStore.user()?.isAuthenticated) {
        this.loggerService.log('redirect: user is authenticated');
        void router.navigate(['/logged-in']);
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
