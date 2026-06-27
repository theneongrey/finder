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
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TitleBarComponent } from '../../common/ui/components/title-bar/title-bar.component';
import { UserAvatarComponent } from '../../common/ui/components/user-avatar/user-avatar.component';
import { TitleService } from '../../common/services/title.service';
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
    Button,
    InputText,
    InputGroup,
    InputGroupAddon,
    Select,
    Toast,
    TitleBarComponent,
    UserAvatarComponent,
    TranslatePipe,
  ],
  providers: [MessageService],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private userStore = inject(UserStore);
  private translateService = inject(TranslateService);
  private events = inject(Events);
  private messageService = inject(MessageService);

  user = this.userStore.user;
  isSaving = signal(false);

  languages = [
    { label: 'English', value: 'en' },
    { label: 'Deutsch', value: 'de' },
    { label: 'Español', value: 'es' },
  ];

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl({ value: '', disabled: true }),
    language: new FormControl<SupportedLanguage>(getStoredLanguage()),
  });

  constructor() {
    const titleService = inject(TitleService);
    const router = inject(Router);

    const title = this.translateService.translate('settings.title');
    effect(() => titleService.setTitle(title()));

    const previousUrl =
      router.getCurrentNavigation()?.previousNavigation?.finalUrl;
    titleService.setBackroute(
      previousUrl ? router.serializeUrl(previousUrl) : '/project',
    );

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
        this.messageService.add({
          severity: payload.success ? 'success' : 'error',
          detail: this.translateService.instant(
            payload.success ? 'settings.saveSuccess' : 'settings.saveError',
          ),
        });
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
