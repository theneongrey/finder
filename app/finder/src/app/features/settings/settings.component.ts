import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { Router } from '@angular/router';
import { UserStore } from '@common/data/user.store';
import {
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { TitleBarComponent } from '@smart/title-bar/title-bar.component';
import { TitleBarService } from '@common/services/title-bar.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
    getStoredLanguage,
    LANGUAGE_OPTIONS,
    SUPPORTED_LANGUAGES,
    SupportedLanguage,
} from '@common/i18n/languages';
import { UserAvatarComponent } from '@smart/user-avatar/user-avatar.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import {
    DsSegmentedControlComponent,
    SegmentOption,
} from '@ds/segmented-control/ds-segmented-control.component';
import { DsCardComponent } from '@ds/card/ds-card.component';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { NotificationValue } from '@common/models/notification-setting.model';

@Component({
    selector: 'app-settings',
    imports: [
        NgTemplateOutlet,
        ReactiveFormsModule,
        TitleBarComponent,
        TranslatePipe,
        UserAvatarComponent,
        DsInputComponent,
        DsSegmentedControlComponent,
        DsCardComponent,
        DsIconComponent,
    ],
    templateUrl: './settings.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
    private readonly userStore = inject(UserStore);
    private readonly translateService = inject(TranslateService);
    private readonly router = inject(Router);

    readonly isDesktop = toSignal(
        inject(BreakpointObserver)
            .observe('(min-width: 680px)')
            .pipe(map((r) => r.matches)),
        { initialValue: false },
    );

    readonly user = this.userStore.user;
    readonly selectedLanguage = signal<SupportedLanguage>(getStoredLanguage());
    readonly notifications = this.userStore.notifications;
    readonly notificationsLoading = this.userStore.notificationsLoading;

    protected readonly languageOptions = LANGUAGE_OPTIONS;

    private readonly notifOff = this.translateService.translate(
        'settings.notifications.off',
    );
    private readonly notifAll = this.translateService.translate(
        'settings.notifications.all',
    );

    readonly notificationOptions = computed<SegmentOption[]>(() => [
        { value: 'off', label: this.notifOff() },
        { value: 'favOnly', label: '-only', icon: 'heart' },
        { value: 'all', label: this.notifAll() },
    ]);

    readonly form = new FormGroup({
        name: new FormControl('', [Validators.required]),
    });

    constructor() {
        const titleService = inject(TitleBarService);

        const title = this.translateService.translate('settings.title');
        effect(() => titleService.setTitle(title()));

        this.userStore.loadNotifications();

        effect(() => {
            const user = this.user();
            if (user) {
                const language = (
                    SUPPORTED_LANGUAGES as readonly string[]
                ).includes(user.language)
                    ? (user.language as SupportedLanguage)
                    : getStoredLanguage();
                this.form.patchValue({ name: user.name });
                this.selectedLanguage.set(language);
            }
        });
    }

    onLanguageChange(value: string): void {
        const lang = value as SupportedLanguage;
        this.selectedLanguage.set(lang);
        this.translateService.use(lang);
        this.saveProfile();
    }

    onNameBlur(): void {
        this.saveProfile();
    }

    onNotificationChange(id: number, value: string): void {
        this.userStore.updateNotification({
            id,
            value: value as NotificationValue,
        });
    }

    logout(): void {
        void this.router.navigate(['/logout']);
    }

    private saveProfile(): void {
        if (this.form.valid) {
            this.userStore.updateProfile({
                name: this.form.controls.name.value ?? '',
                language: this.selectedLanguage(),
            });
        }
    }
}
