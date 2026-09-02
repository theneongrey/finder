import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';
import { UserStore } from '@common/data/user.store';
import { TranslateService } from '@ngx-translate/core';
import { SUPPORTED_LANGUAGES, getStoredLanguage } from '@common/i18n/languages';
import { injectBrnCalendarI18n } from '@spartan-ng/brain/calendar';

function applyCalendarLocale(
    lang: string,
    calendarI18n: ReturnType<typeof injectBrnCalendarI18n>,
): void {
    calendarI18n.use({
        months: () =>
            Array.from({ length: 12 }, (_, i) =>
                new Intl.DateTimeFormat(lang, { month: 'short' }).format(
                    new Date(2024, i),
                ),
            ) as [
                string,
                string,
                string,
                string,
                string,
                string,
                string,
                string,
                string,
                string,
                string,
                string,
            ],
        formatHeader: (month, year) =>
            new Date(year, month).toLocaleDateString(lang, {
                month: 'long',
                year: 'numeric',
            }),
        formatMonth: (month) =>
            new Date(2000, month).toLocaleDateString(lang, { month: 'short' }),
        formatYear: (year) =>
            new Date(year, 0).toLocaleDateString(lang, { year: 'numeric' }),
        formatWeekdayName: (index) =>
            new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(
                new Date(2024, 0, 7 + index),
            ),
        labelWeekday: (index) =>
            new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(
                new Date(2024, 0, 7 + index),
            ),
    });
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

        let pollStarted = false;
        effect(() => {
            if (userStore.user()?.isAuthenticated && !pollStarted) {
                pollStarted = true;
                userStore.startPolling();
            }
        });

        applyCalendarLocale(getStoredLanguage(), calendarI18n);
        translateService.onLangChange.subscribe(({ lang }) =>
            applyCalendarLocale(lang, calendarI18n),
        );
    }
}
