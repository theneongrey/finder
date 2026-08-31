import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
    LANGUAGE_STORAGE_KEY,
    detectBrowserLanguage,
    getStoredLanguage,
} from '@common/i18n/languages';
import { UserService } from '@common/services/user.service';

@Component({
    selector: 'app-language-redirect',
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageRedirectComponent {
    constructor() {
        const router = inject(Router);
        const userService = inject(UserService);

        userService.getUser().subscribe({
            next: (user) => {
                if (user?.isAuthenticated) {
                    router.navigate(['polls'], { replaceUrl: true });
                } else {
                    this.redirectToLanguageHome(router);
                }
            },
            error: () => this.redirectToLanguageHome(router),
        });
    }

    private redirectToLanguageHome(router: Router): void {
        const lang = localStorage.getItem(LANGUAGE_STORAGE_KEY)
            ? getStoredLanguage()
            : detectBrowserLanguage();
        router.navigate([lang], { replaceUrl: true });
    }
}
