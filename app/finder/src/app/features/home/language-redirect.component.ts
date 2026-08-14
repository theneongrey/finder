import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LANGUAGE_STORAGE_KEY, detectBrowserLanguage, getStoredLanguage } from '../../common/i18n/languages';

@Component({
  selector: 'app-language-redirect',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageRedirectComponent {
  constructor() {
    const router = inject(Router);
    const lang = localStorage.getItem(LANGUAGE_STORAGE_KEY)
      ? getStoredLanguage()
      : detectBrowserLanguage();
    router.navigate([lang], { replaceUrl: true });
  }
}
