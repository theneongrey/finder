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
import { TitleBarService } from '../../../common/services/title-bar.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-code-login',
  imports: [ReactiveFormsModule, InputOtp, Panel, Button, TranslatePipe],
  templateUrl: './code-login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'm-auto',
  },
})
export class CodeLoginComponent {
  private userStore = inject(UserStore);
  private loggerService = new LoggerService();
  private router = inject(Router);
  private attempts = 0;

  form = new FormGroup({
    code: new FormControl('', [Validators.required]),
  });

  constructor() {
    inject(TitleBarService).disableTitle();

    if (!this.userStore.loginMail.email()) {
      this.loggerService.log('redirect: no email stored');
      void this.router.navigate(['/']);
    }
  }

  verifyCode() {
    const code = this.form.get('code')!.value!;

    if (this.form.valid && code.length === 6) {
      this.attempts++;
      if (this.attempts >= 3) {
        void this.router.navigate(['/logout']);
        return;
      }
      this.userStore.loginByCode(code);
    }
  }
}
