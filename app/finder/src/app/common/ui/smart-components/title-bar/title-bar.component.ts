import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    DOCUMENT,
    effect,
    inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import {
    distinctUntilChanged,
    map,
    scan,
    share,
    startWith,
} from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { UserStore } from '../../../data/user.store';
import { TitleBarService } from '../../../services/title-bar.service';
import { DsButtonComponent } from '@ds/button/ds-button.component';
import { TranslatePipe } from '@ngx-translate/core';
import { NotificationsPanelComponent } from '@smart/notifications-panel/notifications-panel.component';

/** Scroll distance (px) in one direction before the bar hides / reappears. */
const SCROLL_TOGGLE_DISTANCE = 24;
/** Near the top of the page the bar is always shown. */
const SCROLL_TOP_ZONE = 40;

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
    host: { '[class.title-bar-host--hidden]': 'isScrollHidden()' },
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
    action = this.titleService.action;
    hasBack = computed(() => !!(this.backRoute() || this.backFn()));

    private readonly scrollY$ = fromEvent(window, 'scroll', {
        passive: true,
    }).pipe(
        map(() => window.scrollY),
        share(),
    );

    isScrolled = toSignal(
        this.scrollY$.pipe(
            map((y) => y > 40),
            startWith(false),
            distinctUntilChanged(),
        ),
        { initialValue: false },
    );

    /** Hide the bar after scrolling down a bit; reveal it again after scrolling up a bit.
     *  Movement accumulates per direction so small jitters don't toggle it. */
    isScrollHidden = toSignal(
        this.scrollY$.pipe(
            scan(
                (state, y) => {
                    const delta = y - state.lastY;
                    // Reset the travelled distance whenever the direction flips.
                    const travelled =
                        Math.sign(delta) === Math.sign(state.travelled)
                            ? state.travelled + delta
                            : delta;
                    let hidden = state.hidden;
                    if (y <= SCROLL_TOP_ZONE) {
                        hidden = false;
                    } else if (travelled > SCROLL_TOGGLE_DISTANCE) {
                        hidden = true;
                    } else if (travelled < -SCROLL_TOGGLE_DISTANCE) {
                        hidden = false;
                    }
                    return { lastY: y, travelled, hidden };
                },
                { lastY: 0, travelled: 0, hidden: false },
            ),
            map((state) => state.hidden),
            distinctUntilChanged(),
        ),
        { initialValue: false },
    );

    constructor() {
        // Expose the hidden state globally so sticky page bars can follow the title bar
        // (they read --title-bar-offset, which this class zeroes on mobile).
        const root = inject(DOCUMENT).documentElement;
        effect(() => {
            root.classList.toggle(
                'title-bar-hidden',
                this.isHidden() || this.isScrollHidden(),
            );
        });
        inject(DestroyRef).onDestroy(() =>
            root.classList.remove('title-bar-hidden'),
        );
    }

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
