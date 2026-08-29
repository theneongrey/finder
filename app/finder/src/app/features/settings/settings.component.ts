import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Events } from '@ngrx/signals/events';
import { UserStore } from '@common/data/user.store';
import { profileUpdateFinished } from '@common/data/user-profile.feature';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toast } from '@spartan-ng/brain/sonner';
import { TitleBarComponent } from '@smart/title-bar/title-bar.component';
import { TitleBarService } from '@common/services/title-bar.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  getStoredLanguage,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '@common/i18n/languages';
import { DsAvatarComponent } from '@ds/avatar/ds-avatar.component';
import { DsInputComponent } from '@ds/input/ds-input.component';
import {
  DsSegmentedControlComponent,
  SegmentOption,
} from '@ds/segmented-control/ds-segmented-control.component';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { DsCardComponent } from '@ds/card/ds-card.component';

const PERSON_PALETTE = [
  { bg: 'var(--person-1-bg)', fg: 'var(--person-1-fg)' },
  { bg: 'var(--person-2-bg)', fg: 'var(--person-2-fg)' },
  { bg: 'var(--person-3-bg)', fg: 'var(--person-3-fg)' },
  { bg: 'var(--person-4-bg)', fg: 'var(--person-4-fg)' },
  { bg: 'var(--person-5-bg)', fg: 'var(--person-5-fg)' },
  { bg: 'var(--person-6-bg)', fg: 'var(--person-6-fg)' },
  { bg: 'var(--person-7-bg)', fg: 'var(--person-7-fg)' },
  { bg: 'var(--person-8-bg)', fg: 'var(--person-8-fg)' },
];

function nameHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) { h = (h * 31 + name.charCodeAt(i)) >>> 0; }
  return h;
}

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    TitleBarComponent,
    TranslatePipe,
    DsAvatarComponent,
    DsInputComponent,
    DsSegmentedControlComponent,
    DsButtonComponent,
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
  readonly isSaving = signal(false);
  readonly selectedLanguage = signal<SupportedLanguage>(getStoredLanguage());

  protected readonly languageOptions: SegmentOption[] = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
  ];

  readonly form = new FormGroup({
    name: new FormControl('', [Validators.required]),
  });

  protected readonly initial = computed(() => this.user()?.name?.[0]?.toUpperCase() ?? '');

  protected readonly avatarPalette = computed(() => {
    const name = this.user()?.name ?? '';
    return PERSON_PALETTE[nameHash(name) % PERSON_PALETTE.length];
  });

  constructor() {
    const titleService = inject(TitleBarService);

    const title = this.translateService.translate('settings.title');
    effect(() => titleService.setTitle(title()));

    effect(() => {
      const user = this.user();
      if (user) {
        const language = (SUPPORTED_LANGUAGES as readonly string[]).includes(user.language)
          ? (user.language as SupportedLanguage)
          : getStoredLanguage();
        this.form.patchValue({ name: user.name });
        this.selectedLanguage.set(language);
      }
    });

    effect(() => {
      this.translateService.use(this.selectedLanguage());
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

  onLanguageChange(value: string): void {
    this.selectedLanguage.set(value as SupportedLanguage);
  }

  save(): void {
    if (this.form.valid && !this.isSaving()) {
      this.isSaving.set(true);
      this.userStore.updateProfile({
        name: this.form.controls.name.value ?? '',
        language: this.selectedLanguage(),
      });
    }
  }
}
