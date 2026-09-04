import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { UserStore } from '../../../data/user.store';
import { TitleBarService } from '../../../services/title-bar.service';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { TranslatePipe } from '@ngx-translate/core';
import { NotificationsPanelComponent } from '@smart/notifications-panel/notifications-panel.component';

@Component({
    selector: 'app-title-bar',
    imports: [
        NgOptimizedImage,
        HlmSkeleton,
        DsButtonComponent,
        TranslatePipe,
        NotificationsPanelComponent,
    ],
    templateUrl: './title-bar.component.html',
    styleUrl: './title-bar.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TitleBarComponent {
    private readonly userStore = inject(UserStore);
    private readonly titleService = inject(TitleBarService);
    private readonly router = inject(Router);

    user = this.userStore.user;
    title = this.titleService.title;
    subtitle = this.titleService.subtitle;
    titleDisabled = computed(() => this.title() === null);
    backRoute = this.titleService.backRoute;
    backFn = this.titleService.backFn;
    progress = this.titleService.progress;
    isHidden = this.titleService.isHidden;
    hasBack = computed(() => !!(this.backRoute() || this.backFn()));

    isScrolled = toSignal(
        fromEvent(window, 'scroll', { passive: true }).pipe(
            map(() => window.scrollY > 40),
            startWith(false),
            distinctUntilChanged(),
        ),
        { initialValue: false },
    );

    onBack(): void {
        const fn = this.backFn();
        if (fn) {
            fn();
        } else if (this.backRoute()) {
            this.router.navigate([this.backRoute()!]);
        }
    }

    login(): void {
        this.userStore.setRedirectUrl(this.router.url);
        this.router.navigate(['/auth/request-email']);
    }
}
