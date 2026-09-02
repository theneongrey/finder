import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    OnInit,
} from '@angular/core';
import { UserStore } from '@common/data/user.store';
import {
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TitleBarService } from '@common/services/title-bar.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
@Component({
    selector: 'app-request-email',
    imports: [
        ReactiveFormsModule,
        DsButtonComponent,
        DsInputComponent,
        TranslatePipe,
    ],
    templateUrl: './request-email.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'flex flex-col',
    },
})
export class RequestEmailComponent implements OnInit {
    private userStore = inject(UserStore);
    private translateService = inject(TranslateService);
    private route = inject(ActivatedRoute);

    isLoading = computed(() => this.userStore.loginMail.state() === 'sent');

    private errorSendingMessage = this.translateService.translate(
        'auth.requestEmail.errorSending',
    );
    private errorForbiddenMessage = this.translateService.translate(
        'auth.requestEmail.errorForbidden',
    );
    private errorRateLimiterMessage = this.translateService.translate(
        'auth.requestEmail.errorRateLimiter',
    );

    errorMessage = computed(() => {
        const state = this.userStore.loginMail.state();
        switch (state) {
            case 'error':
                return this.errorSendingMessage();
            case 'forbidden':
                return this.errorForbiddenMessage();
            case 'rate-limiter':
                return this.errorRateLimiterMessage();
            default:
                return undefined;
        }
    });

    form = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
    });

    constructor() {
        const router = inject(Router);
        inject(TitleBarService).disableTitle();

        effect(() => {
            if (
                this.userStore.loginMail.state() === 'finished' &&
                this.userStore.loginMail.email()
            ) {
                router.navigate(['/auth/code-login']);
            }
        });
    }

    ngOnInit(): void {
        const emailParam = this.route.snapshot.queryParams['email'];
        if (emailParam) {
            this.form.get('email')!.setValue(emailParam);
        }
    }

    sendLoginMail(): void {
        if (this.form.valid) {
            this.userStore.requestLoginMail(this.form.get('email')!.value!);
        }
    }
}
