import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
    signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { DsIconComponent } from '@ds/icon/ds-icon.component';

const SWIPE_THRESHOLD = 75;
/** Movement (px) before the gesture commits to an axis. */
const AXIS_LOCK = 8;
const SPRING_BACK = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

/**
 * Wraps an option card so it can be swiped left/right on touch devices to vote, like the vote
 * overlay — but the card springs back into the grid instead of flying away. Vertical scrolling
 * stays native (`touch-action: pan-y`); mouse input is ignored, so desktop is unaffected.
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
        '[style.touch-action]': "enabled() ? 'pan-y' : null",
        '(touchstart)': 'onTouchStart($event)',
        '(touchmove)': 'onTouchMove($event)',
        '(touchend)': 'onTouchEnd($event)',
        '(touchcancel)': 'reset()',
    },
})
export class SwipeVoteCardComponent {
    enabled = input(true);
    mode = input<'yesno' | 'rating' | 'date'>('yesno');

    /** true = swiped right (yes / top rating), false = left (no / lowest rating). */
    swiped = output<boolean>();

    private readonly dx = signal(0);
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

    private startX = 0;
    private startY = 0;
    private axis: 'x' | 'y' | undefined;
    private tracking = false;

    protected onTouchStart(event: TouchEvent): void {
        if (!this.enabled() || event.touches.length !== 1) {
            return;
        }
        this.tracking = true;
        this.axis = undefined;
        this.startX = event.touches[0].clientX;
        this.startY = event.touches[0].clientY;
        this.transition.set('none');
    }

    protected onTouchMove(event: TouchEvent): void {
        if (!this.tracking) {
            return;
        }
        const dx = event.touches[0].clientX - this.startX;
        const dy = event.touches[0].clientY - this.startY;
        if (!this.axis) {
            if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) {
                return;
            }
            this.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        }
        if (this.axis === 'x') {
            this.dx.set(dx);
        }
    }

    protected onTouchEnd(event: TouchEvent): void {
        if (!this.tracking) {
            return;
        }
        const dx = this.dx();
        if (this.axis === 'x') {
            // A horizontal drag must not also count as a tap on the button under the finger.
            event.preventDefault();
            if (Math.abs(dx) > SWIPE_THRESHOLD) {
                this.swiped.emit(dx > 0);
            }
        }
        this.reset();
    }

    protected reset(): void {
        this.tracking = false;
        this.axis = undefined;
        this.transition.set(SPRING_BACK);
        this.dx.set(0);
    }
}
