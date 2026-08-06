import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { UserStore } from './common/data/user.store';
import { TranslateService } from '@ngx-translate/core';
import { SUPPORTED_LANGUAGES } from './common/i18n/languages';
import { injectBrnCalendarI18n } from '@spartan-ng/brain/calendar';

type MonthTuple = [string, string, string, string, string, string, string, string, string, string, string, string];

function monthNamesForLocale(locale: string): MonthTuple {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short' });
  return Array.from({ length: 12 }, (_, i) =>
    fmt.format(new Date(2024, i)),
  ) as MonthTuple;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ...HlmToasterImports],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor() {
    const userStore = inject(UserStore);
    const translateService = inject(TranslateService);
    const calendarI18n = injectBrnCalendarI18n();

    userStore.getUser();
    translateService.addLangs([...SUPPORTED_LANGUAGES]);

    const syncCalendarLocale = (lang: string) =>
      calendarI18n.use({ months: () => monthNamesForLocale(lang) });

    syncCalendarLocale(getStoredLanguage());
    translateService.onLangChange.subscribe(({ lang }) => syncCalendarLocale(lang));
  }
}
