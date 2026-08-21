import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { DsButtonComponent } from '../../../common/ui/ds-components/button/ds-button.component';
import { DsInputComponent } from '../../../common/ui/ds-components/input/ds-input.component';
import { TitleBarService } from '../../../common/services/title-bar.service';

@Component({
  selector: 'app-auth-login',
  imports: [ReactiveFormsModule, DsButtonComponent, DsInputComponent],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col',
  },
})
export class LoginComponent {
  private router = inject(Router);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor() {
    inject(TitleBarService).disableTitle();
  }

  submit(): void {
    if (this.form.valid) {
      void this.router.navigate(['/auth/request-email'], {
        queryParams: { email: this.form.get('email')!.value },
      });
    }
  }
}
