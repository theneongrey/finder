import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    untracked,
    viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { UserStore } from '@common/data/user.store';
import { DsIconComponent } from '@ds/icon/ds-icon.component';
import { FeedbackStore } from '../_data/feedback.store';
import { FeedbackPanelComponent } from '../feedback-panel/feedback-panel.component';
import { SubmitFeedbackRequest } from '../_models/feedback.model';

/** Routes where the tab never shows, even for a logged-in user (landing + auth flow). */
const HIDDEN_ROUTE_PATTERN =
    /^\/(?:(?:de|en|es)\/?)?$|^\/(?:auth|logout)(?:\/|$)/;

@Component({
    selector: 'app-feedback-tab',
    imports: [TranslatePipe, DsIconComponent, FeedbackPanelComponent],
    templateUrl: './feedback-tab.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackTabComponent {
    private readonly userStore = inject(UserStore);
    private readonly feedbackStore = inject(FeedbackStore);
    private readonly router = inject(Router);

    private readonly url = toSignal(
        this.router.events.pipe(
            filter((e): e is NavigationEnd => e instanceof NavigationEnd),
            map((e) => e.urlAfterRedirects),
        ),
        { initialValue: this.router.url },
    );

    /** Path without query string or fragment — that's what gets sent as "screen". */
    protected readonly page = computed(
        () => this.url().split(/[?#]/)[0] || '/',
    );

    protected readonly user = this.userStore.user;
    protected readonly panelOpen = this.feedbackStore.panelOpen;
    protected readonly submitting = this.feedbackStore.submitting;

    private readonly tabButton =
        viewChild<ElementRef<HTMLButtonElement>>('tabButton');

    protected readonly visible = computed(
        () =>
            !!this.user()?.isAuthenticated &&
            this.feedbackStore.buttonHidden() === false &&
            !HIDDEN_ROUTE_PATTERN.test(this.page()),
    );

    // A computed identity (not the user object) so profile edits don't retrigger the load below.
    private readonly userKey = computed(() => {
        const user = this.user();
        return user?.isAuthenticated ? user.email : undefined;
    });

    constructor() {
        // Load the preference for whoever is logged in; reset when they log out or switch accounts.
        effect(() => {
            const userKey = this.userKey();
            untracked(() => {
                this.feedbackStore.reset();
                if (userKey) {
                    this.feedbackStore.loadPreference();
                }
            });
        });

        // Return focus to the tab when the panel closes (the panel moves focus in on open).
        let wasOpen = false;
        effect(() => {
            const open = this.panelOpen();
            if (wasOpen && !open) {
                untracked(() => this.tabButton()?.nativeElement.focus());
            }
            wasOpen = open;
        });
    }

    protected toggle(): void {
        if (this.panelOpen()) {
            this.feedbackStore.closePanel();
        } else {
            this.feedbackStore.openPanel();
        }
    }

    protected close(): void {
        this.feedbackStore.closePanel();
    }

    protected send(request: SubmitFeedbackRequest): void {
        this.feedbackStore.submit(request);
    }

    protected hide(): void {
        this.feedbackStore.setButtonHidden({
            buttonHidden: true,
            notifyHidden: true,
        });
    }
}
