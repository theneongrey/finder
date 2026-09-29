import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    signal,
    untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserStore } from '@common/data/user.store';
import { MAX_CODE_ATTEMPTS } from '@common/data/user-auth.feature';
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
@Component({
    selector: 'app-auth-code-login',
    imports: [
        ReactiveFormsModule,
        DsInputOtpComponent,
        DsButtonComponent,
        DsIconComponent,
        TranslatePipe,
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

    readonly email = this.userStore.loginMail.email;

    /** Submitted with fewer than 6 digits. */
    private readonly incomplete = signal(false);
    /** A login attempt made on this screen failed; cleared when the code is edited. */
    private readonly failed = signal(false);

    /** The backend voids the code after too many wrong tries — only a new code helps. */
    readonly codeVoided = computed(
        () => this.userStore.codeLoginRejections() >= MAX_CODE_ATTEMPTS,
    );
    readonly hasError = computed(
        () => this.incomplete() || this.failed() || this.codeVoided(),
    );
    readonly errorKey = computed(() => {
        if (this.codeVoided()) {
            return 'auth.codeLogin.tooManyAttempts';
        }
        if (this.failed()) {
            switch (this.userStore.codeLoginError()) {
                case 'rate-limited':
                    return 'auth.requestEmail.errorRateLimiter';
                case 'error':
                    return 'auth.codeLogin.error';
            }
        }
        return 'auth.codeLogin.invalidCode';
    });

    form = new FormGroup({
        code: new FormControl('', [Validators.required]),
    });

    constructor() {
        inject(TitleBarService).disableTitle();

        // Only failures after this screen opened count, so returning to it later doesn't
        // replay an old error. The auth shell shakes the card on the same counter.
        let seenFailures = untracked(this.userStore.codeLoginFailures);
        effect(() => {
            const failures = this.userStore.codeLoginFailures();
            if (failures > seenFailures) {
                seenFailures = failures;
                this.failed.set(true);
            }
        });
        this.form.controls.code.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe(() => {
                this.incomplete.set(false);
                this.failed.set(false);
            });

        if (!this.userStore.loginMail.email()) {
            this.loggerService.log('redirect: no email stored');
            void this.router.navigate(['/']);
        }
    }

    submit(): void {
        if (this.codeVoided()) {
            this.requestNewCode();
            return;
        }

        const code = this.form.controls.code.value ?? '';
        if (this.form.valid && code.length === 6) {
            this.failed.set(false);
            this.userStore.loginByCode(code);
        } else {
            this.incomplete.set(true);
        }
    }

    editEmail(): void {
        this.userStore.resetLoginMail();
        void this.router.navigate(['/auth/request-email']);
    }

    private requestNewCode(): void {
        this.form.reset();
        this.userStore.requestLoginMail(this.email()!);
    }
}
