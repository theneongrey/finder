import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    untracked,
} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { NgOptimizedImage } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserStore } from '../../common/data/user.store';
import {
    NavigationEnd,
    Router,
    RouterLink,
    RouterOutlet,
} from '@angular/router';
import { LoggerService } from '../../common/services/logger.service';
import { DsButtonComponent } from '../../common/ui/ds-components/button/ds-button.component';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthShellDefaultSidebarComponent } from './_shared/auth-shell-default-sidebar.component';
import { AuthShellFirstLoginSidebarComponent } from './_shared/auth-shell-first-login-sidebar.component';
import { filter, map, startWith } from 'rxjs';

@Component({
    selector: 'app-auth-shell',
    imports: [
        RouterOutlet,
        RouterLink,
        NgOptimizedImage,
        DsButtonComponent,
        TranslatePipe,
        AuthShellDefaultSidebarComponent,
        AuthShellFirstLoginSidebarComponent,
    ],
    templateUrl: './shell.component.html',
    host: { class: 'flex flex-col h-dvh bg-app-gradient' },
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('sidebarSwap', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('250ms ease-out', style({ opacity: 1 })),
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0 })),
            ]),
        ]),
    ],
})
export class AuthShellComponent {
    private userStore = inject(UserStore);
    private loggerService = inject(LoggerService);
    private router = inject(Router);

    protected readonly isFirstLogin = toSignal(
        this.router.events.pipe(
            filter((e) => e instanceof NavigationEnd),
            map(() => this.router.url.includes('/auth/first-login')),
            startWith(this.router.url.includes('/auth/first-login')),
        ),
        { initialValue: false },
    );

    constructor() {
        effect(() => {
            const user = this.userStore.user();
            if (!user) {
                return;
            }

            if (user.isAuthenticated) {
                this.loggerService.log('user is authenticated');

                if (!user.name) {
                    this.loggerService.log(
                        'first time user. redirect to first login',
                    );
                    this.router.navigate(['/auth/first-login']);
                    return;
                }

                const target = untracked((): string => {
                    const redirectUrl = this.userStore.redirectUrl();
                    if (redirectUrl) {
                        this.loggerService.log(`redirect to ${redirectUrl}`);
                        this.userStore.setRedirectUrl(undefined);
                        return redirectUrl;
                    }
                    this.loggerService.log('redirect to project overview');
                    return '/polls';
                });

                this.router.navigate(['/auth/login-success'], {
                    state: { target },
                });
            } else {
                this.router.navigate(['/auth/request-email']);
            }
        });

        this.userStore.getUser();
    }
}
