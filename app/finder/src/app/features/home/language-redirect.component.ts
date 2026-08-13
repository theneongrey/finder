import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { detectBrowserLanguage, getStoredLanguage } from '../../common/i18n/languages';

@Component({
  selector: 'app-language-redirect',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageRedirectComponent {
  constructor() {
    const router = inject(Router);
    const stored = localStorage.getItem('language');
    const lang = stored ? getStoredLanguage() : detectBrowserLanguage();
    router.navigate([lang], { replaceUrl: true });
  }
}
