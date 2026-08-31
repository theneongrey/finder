import {
    ChangeDetectionStrategy,
    Component,
    inject,
    signal,
} from '@angular/core';
import { UserStore } from '@common/data/user.store';
import {
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { LoggerService } from '@common/services/logger.service';
import { TitleBarService } from '@common/services/title-bar.service';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsInputOtpComponent } from '@ds/input-otp/ds-input-otp.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStepIndicatorComponent } from '../_shared/auth-step-indicator.component';

@Component({
    selector: 'app-auth-code-login',
    imports: [
        ReactiveFormsModule,
        DsInputOtpComponent,
        DsButtonComponent,
        DsIconComponent,
        TranslatePipe,
        AuthStepIndicatorComponent,
    ],
    templateUrl: './code-login.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'flex flex-col',
    },
})
export class CodeLoginComponent {
    private userStore = inject(UserStore);
    private loggerService = new LoggerService();
    private router = inject(Router);
    private attempts = 0;

    readonly email = this.userStore.loginMail.email;
    readonly hasError = signal(false);

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

    verifyCode(): void {
        const code = this.form.get('code')!.value!;

        if (this.form.valid && code.length === 6) {
            this.attempts++;
            if (this.attempts >= 3) {
                void this.router.navigate(['/logout']);
                return;
            }
            this.hasError.set(false);
            this.userStore.loginByCode(code);
        } else {
            this.hasError.set(true);
        }
    }

    editEmail(): void {
        this.userStore.resetLoginMail();
        void this.router.navigate(['/auth/request-email']);
    }
}
