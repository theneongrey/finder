import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserStore } from '../../common/data/user.store';
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
import { TitleBarComponent } from '../../common/ui/components/title-bar/title-bar.component';
import { UserAvatarComponent } from '../../common/ui/components/user-avatar/user-avatar.component';
import { TitleService } from '../../common/services/title.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  getStoredLanguage,
  LANGUAGE_STORAGE_KEY,
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
    TitleBarComponent,
    UserAvatarComponent,
    TranslatePipe,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private userStore = inject(UserStore);
  private translateService = inject(TranslateService);

  user = this.userStore.user;

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
      previousUrl ? router.serializeUrl(previousUrl) : '/',
    );

    effect(() => {
      const user = this.user();
      if (user) {
        this.form.patchValue({ name: user.name, email: user.email });
      }
    });

    this.form.controls.language.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((language) => {
        if (language) {
          this.translateService.use(language);
          localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        }
      });
  }

  save() {
    if (this.form.valid) {
      this.userStore.updateName(this.form.controls.name.value ?? '');
    }
  }
}
