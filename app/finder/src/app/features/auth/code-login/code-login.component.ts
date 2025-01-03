import { AfterViewInit, Component, effect, inject } from '@angular/core';
import { UserStore } from '../../../common/data/user.store';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-code-login',
  imports: [ReactiveFormsModule],
  templateUrl: './code-login.component.html',
  styleUrl: './code-login.component.css',
})
export class CodeLoginComponent implements AfterViewInit {
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

  ngAfterViewInit(): void {
    this.ensureDigitsOnly();
  }

  verifyCode() {
    const code = this.form.get('code')!.value!;

    if (this.form.valid && code.length === 6) {
      this.userStore.loginByCode(code);
    }
  }

  private ensureDigitsOnly() {
    document
      .getElementById('code')!
      .addEventListener('beforeinput', function (event) {
        const { target }: any = event;

        const nextVal =
          target!.value.substring(0, target!.selectionStart) +
          (event.data ?? '') +
          target!.value.substring(target!.selectionEnd);

        if (!/^(\d{0,7}|\d{3}-?\d{0,4}|)$/.test(nextVal)) {
          event.preventDefault();
        }
        return;
      });
  }
}
