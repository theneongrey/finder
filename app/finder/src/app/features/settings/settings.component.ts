import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Events } from '@ngrx/signals/events';
import { UserStore } from '../../common/data/user.store';
import { profileUpdateFinished } from '../../common/data/user-profile.feature';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { TitleBarComponent } from '../../common/ui/components/title-bar/title-bar.component';
import { UserAvatarComponent } from '../../common/ui/components/user-avatar/user-avatar.component';
import { TitleBarService } from '../../common/services/title-bar.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  getStoredLanguage,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '../../common/i18n/languages';

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    HlmButton,
    HlmInput,
    ...HlmSelectImports,
    TitleBarComponent,
    UserAvatarComponent,
    TranslatePipe,
  ],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private userStore = inject(UserStore);
  private translateService = inject(TranslateService);
  private events = inject(Events);

  user = this.userStore.user;
  isSaving = signal(false);

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl({ value: '', disabled: true }),
    language: new FormControl<SupportedLanguage>(getStoredLanguage()),
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
        this.form.patchValue({ name: user.name, email: user.email, language });
      }
    });

    this.form.controls.language.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((language) => {
        if (language) {
          this.translateService.use(language);
        }
      });

    this.events
      .on(profileUpdateFinished)
      .pipe(takeUntilDestroyed())
      .subscribe(({ payload }) => {
        this.isSaving.set(false);
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

  save() {
    if (this.form.valid) {
      this.isSaving.set(true);
      this.userStore.updateProfile({
        name: this.form.controls.name.value ?? '',
        language: this.form.controls.language.value ?? getStoredLanguage(),
      });
    }
  }
}
