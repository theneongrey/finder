import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { DsIconComponent } from '@ds/icon/ds-icon.component';

const SWIPE_THRESHOLD = 75;
/** Movement (px) before the gesture commits to an axis. */
const AXIS_LOCK = 8;
/** Swiping is a mobile-layout gesture; the desktop layout votes via the buttons only. */
const DESKTOP_QUERY = '(min-width: 680px)';
const SPRING_BACK = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

/**
 * Wraps an option card so it can be dragged left/right — by touch or mouse, in the mobile layout
 * only — to vote, like the vote overlay, but the card springs back into the grid instead of flying away. Vertical touch
 * scrolling stays native (`touch-action: pan-y`), and a drag never also counts as a click.
 */
@Component({
    selector: 'app-swipe-vote-card',
    templateUrl: './swipe-vote-card.component.html',
    styleUrl: './swipe-vote-card.component.css',
    imports: [TranslatePipe, DsIconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[style.transform]': 'transform()',
        '[style.transition]': 'transition()',
        '[style.touch-action]': "active() ? 'pan-y' : null",
        '[class.is-dragging]': 'dragging()',
        '(pointerdown)': 'onPointerDown($event)',
        '(window:pointermove)': 'onPointerMove($event)',
        '(window:pointerup)': 'onPointerUp()',
        '(window:pointercancel)': 'reset()',
    },
})
export class SwipeVoteCardComponent {
    enabled = input(true);
    mode = input<'yesno' | 'rating' | 'date'>('yesno');

    /** true = swiped right (yes / top rating), false = left (no / lowest rating). */
    swiped = output<boolean>();

    private readonly isDesktop = toSignal(
        inject(BreakpointObserver)
            .observe(DESKTOP_QUERY)
            .pipe(map((r) => r.matches)),
        { initialValue: false },
    );
    /** Swiping is on: enabled by the card and in the mobile layout. */
    protected readonly active = computed(
        () => this.enabled() && !this.isDesktop(),
    );

    private readonly dx = signal(0);
    protected readonly dragging = signal(false);
    protected readonly transition = signal('');
    protected readonly transform = computed(() => {
        const dx = this.dx();
        return dx ? `translateX(${dx}px) rotate(${dx / 30}deg)` : '';
    });
    protected readonly yesOpacity = computed(() =>
        Math.min(Math.max((this.dx() - 30) / 60, 0), 1),
    );
    protected readonly noOpacity = computed(() =>
        Math.min(Math.max((-this.dx() - 30) / 60, 0), 1),
    );

    private pointerId: number | undefined;
    private startX = 0;
    private startY = 0;
    private axis: 'x' | 'y' | undefined;
    /** Set when a horizontal drag ends so the click that follows it is swallowed. */
    private suppressClick = false;

    constructor() {
        // Capture phase: the card's buttons handle clicks before a bubbling host listener would.
        const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
        const onClick = (event: MouseEvent) => this.onClickCapture(event);
        host.addEventListener('click', onClick, { capture: true });
        inject(DestroyRef).onDestroy(() =>
            host.removeEventListener('click', onClick, { capture: true }),
        );
    }

    protected onPointerDown(event: PointerEvent): void {
        if (
            !this.active() ||
            this.pointerId !== undefined ||
            !event.isPrimary ||
            (event.pointerType === 'mouse' && event.button !== 0)
        ) {
            return;
        }
        this.pointerId = event.pointerId;
        this.axis = undefined;
        this.suppressClick = false;
        this.startX = event.clientX;
        this.startY = event.clientY;
        this.transition.set('none');
    }

    protected onPointerMove(event: PointerEvent): void {
        if (event.pointerId !== this.pointerId) {
            return;
        }
        const dx = event.clientX - this.startX;
        const dy = event.clientY - this.startY;
        if (!this.axis) {
            if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) {
                return;
            }
            this.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
            if (this.axis === 'x') {
                // Mouse drags would otherwise select the card's text.
                window.getSelection()?.removeAllRanges();
                this.dragging.set(true);
            }
        }
        if (this.axis === 'x') {
            this.dx.set(dx);
        }
    }

    protected onPointerUp(): void {
        if (this.pointerId === undefined) {
            return;
        }
        const dx = this.dx();
        if (this.axis === 'x') {
            this.suppressClick = true;
            if (Math.abs(dx) > SWIPE_THRESHOLD) {
                this.swiped.emit(dx > 0);
            }
        }
        this.reset();
    }

    /** A drag that started on a button must not also press it. */
    private onClickCapture(event: MouseEvent): void {
        if (this.suppressClick) {
            this.suppressClick = false;
            event.stopPropagation();
            event.preventDefault();
        }
    }

    protected reset(): void {
        this.pointerId = undefined;
        this.axis = undefined;
        this.dragging.set(false);
        this.transition.set(SPRING_BACK);
        this.dx.set(0);
    }
}
