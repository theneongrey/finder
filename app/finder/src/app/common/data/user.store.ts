import { computed } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';
import { withAuthFeature } from './user-auth.feature';
import { withProfileFeature } from './user-profile.feature';
import { SupportedLanguage } from '../i18n/languages';

const dateFormatByLanguage: Record<SupportedLanguage, string> = {
  en: 'M/d/yyyy',
  de: 'dd.MM.yyyy',
  es: 'dd/MM/yyyy',
};

const primengDateFormatByLanguage: Record<SupportedLanguage, string> = {
  en: 'm/d/yy',
  de: 'dd.mm.yy',
  es: 'dd/mm/yy',
};

export const UserStore = signalStore(
  { providedIn: 'root' },
  withAuthFeature(),
  withProfileFeature(),
  withComputed((store) => ({
    dateFormat: computed(() => {
      const lang = (store.user()?.language ?? 'en') as SupportedLanguage;
      return dateFormatByLanguage[lang] ?? dateFormatByLanguage['en'];
    }),
    primengDateFormat: computed(() => {
      const lang = (store.user()?.language ?? 'en') as SupportedLanguage;
      return primengDateFormatByLanguage[lang] ?? primengDateFormatByLanguage['en'];
    }),
  })),
);
