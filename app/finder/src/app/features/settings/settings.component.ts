import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Events } from '@ngrx/signals/events';
import { UserStore } from '@common/data/user.store';
import { profileUpdateFinished } from '@common/data/user-profile.feature';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toast } from '@spartan-ng/brain/sonner';
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
import { DsSegmentedControlComponent } from '@ds/segmented-control/ds-segmented-control.component';
import { DsCardComponent } from '@ds/card/ds-card.component';

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    TitleBarComponent,
    TranslatePipe,
    UserAvatarComponent,
    DsInputComponent,
    DsSegmentedControlComponent,
    DsCardComponent,
  ],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly userStore = inject(UserStore);
  private readonly translateService = inject(TranslateService);
  private readonly events = inject(Events);

  readonly user = this.userStore.user;
  readonly selectedLanguage = signal<SupportedLanguage>(getStoredLanguage());

  protected readonly languageOptions = LANGUAGE_OPTIONS;

  readonly form = new FormGroup({
    name: new FormControl('', [Validators.required]),
  });

  constructor() {
    const titleService = inject(TitleBarService);

    const title = this.translateService.translate('settings.title');
    effect(() => titleService.setTitle(title()));

    effect(() => {
      const user = this.user();
      if (user) {
        const language = (SUPPORTED_LANGUAGES as readonly string[]).includes(
          user.language,
        )
          ? (user.language as SupportedLanguage)
          : getStoredLanguage();
        this.form.patchValue({ name: user.name });
        this.selectedLanguage.set(language);
      }
    });

    this.events
      .on(profileUpdateFinished)
      .pipe(takeUntilDestroyed())
      .subscribe(({ payload }) => {
        const message = this.translateService.instant(
          payload.success ? 'settings.saveSuccess' : 'settings.saveError',
        );
        if (payload.success) {
          toast.success(message);
        } else {
          toast.error(message);
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

  private saveProfile(): void {
    if (this.form.valid) {
      this.userStore.updateProfile({
        name: this.form.controls.name.value ?? '',
        language: this.selectedLanguage(),
      });
    }
  }
}
