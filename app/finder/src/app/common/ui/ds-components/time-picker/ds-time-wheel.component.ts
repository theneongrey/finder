import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    input,
    model,
    signal,
    viewChild,
} from '@angular/core';

/** Row height in px — the scroll position maps to the selected index through it.
 *  ds-time-picker sizes its selection band with it too. */
export const TIME_WHEEL_ITEM_HEIGHT = 40;
const ITEM_HEIGHT = TIME_WHEEL_ITEM_HEIGHT;
/** Rows visible above and below the selected one. */
const VISIBLE_AROUND = 2;
/** Wheel delta (px) that moves one row — a mouse notch is ~100, trackpads send many
 *  small deltas that are summed up, so a precise value stays reachable. */
const WHEEL_STEP_DELTA = 40;
/** Pointer travel (px) after which a press counts as a drag, not a click. */
const DRAG_THRESHOLD = 4;
/** Time for the settle animation after a drag before CSS snapping is re-enabled. */
const SNAP_RESTORE_MS = 350;

interface DragState {
    pointerId: number;
    startY: number;
    startTop: number;
    moved: boolean;
}

/**
 * One scroll-snapping column of ds-time-picker. The row in the middle band is the
 * value; mouse wheel (one row per notch), dragging, touch scrolling, clicking a row
 * or ArrowUp/ArrowDown changes it.
 */
@Component({
    selector: 'ds-time-wheel',
    templateUrl: './ds-time-wheel.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'block' },
})
export class DsTimeWheelComponent {
    private static nextId = 0;

    items = input.required<string[]>();
    value = model.required<string>();
    label = input<string>('');

    /** Unique per instance, so row ids don't collide when several pickers share a page. */
    protected readonly idPrefix = `ds-time-wheel-${DsTimeWheelComponent.nextId++}`;
    protected readonly itemHeight = ITEM_HEIGHT;
    protected readonly padding = ITEM_HEIGHT * VISIBLE_AROUND;
    protected readonly height = ITEM_HEIGHT * (VISIBLE_AROUND * 2 + 1);
    protected readonly selectedIndex = computed(() =>
        Math.max(0, this.items().indexOf(this.value())),
    );
    /** Mouse drag in progress — CSS snapping is off so the column follows the pointer. */
    protected readonly dragging = signal(false);

    private readonly scroller =
        viewChild.required<ElementRef<HTMLElement>>('scroller');
    private wheelDelta = 0;
    private drag: DragState | undefined;
    private suppressClick = false;
    /** Row an animated scroll is heading to — scroll events on the way are ignored,
     *  otherwise intermediate positions round back to the old row. */
    private scrollTarget: number | undefined;
    private snapTimer: ReturnType<typeof setTimeout> | undefined;

    constructor() {
        afterNextRender(() =>
            this.scrollToIndex(this.selectedIndex(), 'instant'),
        );
        inject(DestroyRef).onDestroy(() => clearTimeout(this.snapTimer));
    }

    /** Rows fade out with their distance from the middle band. */
    protected rowClass(index: number): string {
        const distance = Math.abs(index - this.selectedIndex());
        if (distance === 0) {
            return 'text-[length:var(--fs-body-lg)] font-extrabold text-[var(--text-primary)]';
        }
        return distance === 1
            ? 'text-[length:var(--fs-body)] font-bold text-[var(--text-tertiary)]'
            : 'text-[length:var(--fs-body-sm)] font-bold text-[var(--text-muted)] opacity-60';
    }

    protected onScroll(): void {
        const top = this.scroller().nativeElement.scrollTop;
        if (this.scrollTarget !== undefined) {
            if (Math.abs(top - this.scrollTarget * ITEM_HEIGHT) < 1) {
                this.scrollTarget = undefined;
            }
            return;
        }
        const index = Math.round(top / ITEM_HEIGHT);
        const item = this.items()[Math.min(index, this.items().length - 1)];
        if (item !== undefined && item !== this.value()) {
            this.value.set(item);
        }
    }

    protected select(index: number): void {
        // A drag that ends on a row also fires a click on it — ignore that one.
        if (this.suppressClick) {
            this.suppressClick = false;
            return;
        }
        this.scrollToIndex(index, 'smooth');
    }

    /** One row per wheel notch instead of the browser's free scrolling. */
    protected onWheel(event: WheelEvent): void {
        event.preventDefault();
        const delta =
            event.deltaMode === WheelEvent.DOM_DELTA_PIXEL
                ? event.deltaY
                : Math.sign(event.deltaY) * WHEEL_STEP_DELTA;
        this.wheelDelta += delta;
        if (Math.abs(this.wheelDelta) < WHEEL_STEP_DELTA) {
            return;
        }
        this.step(Math.sign(this.wheelDelta));
        this.wheelDelta = 0;
    }

    /** Touch keeps native (snapping) scrolling; mouse and pen drag the column. */
    protected onPointerDown(event: PointerEvent): void {
        if (event.pointerType === 'touch' || event.button !== 0) {
            return;
        }
        const el = this.scroller().nativeElement;
        this.scrollTarget = undefined;
        this.suppressClick = false;
        this.drag = {
            pointerId: event.pointerId,
            startY: event.clientY,
            startTop: el.scrollTop,
            moved: false,
        };
    }

    protected onPointerMove(event: PointerEvent): void {
        const drag = this.drag;
        if (drag?.pointerId !== event.pointerId) {
            return;
        }
        const dy = event.clientY - drag.startY;
        if (!drag.moved && Math.abs(dy) < DRAG_THRESHOLD) {
            return;
        }
        if (!drag.moved) {
            // Capture only once it's a drag — capturing on press would retarget the
            // click of a plain tap away from the row.
            drag.moved = true;
            clearTimeout(this.snapTimer);
            this.dragging.set(true);
            this.scroller().nativeElement.setPointerCapture(event.pointerId);
        }
        this.scroller().nativeElement.scrollTop = drag.startTop - dy;
    }

    protected onPointerUp(event: PointerEvent): void {
        const drag = this.drag;
        if (drag?.pointerId !== event.pointerId) {
            return;
        }
        this.drag = undefined;
        if (!drag.moved) {
            return;
        }
        this.suppressClick = event.type === 'pointerup';
        const el = this.scroller().nativeElement;
        this.scrollToIndex(Math.round(el.scrollTop / ITEM_HEIGHT), 'smooth');
        this.snapTimer = setTimeout(
            () => this.dragging.set(false),
            SNAP_RESTORE_MS,
        );
    }

    protected onKeydown(event: KeyboardEvent): void {
        const direction =
            event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
        if (!direction) {
            return;
        }
        event.preventDefault();
        this.step(direction);
    }

    /** Touch takes over from any running animation. */
    protected onTouchStart(): void {
        this.scrollTarget = undefined;
    }

    private step(direction: number): void {
        this.scrollToIndex(
            (this.scrollTarget ?? this.selectedIndex()) + direction,
            'smooth',
        );
    }

    /** Select a row and bring it into the middle band. */
    private scrollToIndex(index: number, behavior: ScrollBehavior): void {
        const clamped = Math.min(this.items().length - 1, Math.max(0, index));
        this.value.set(this.items()[clamped]);
        const el = this.scroller().nativeElement;
        const top = clamped * ITEM_HEIGHT;
        this.scrollTarget =
            behavior === 'smooth' && Math.abs(el.scrollTop - top) >= 1
                ? clamped
                : undefined;
        el.scrollTo({
            top,
            behavior,
        });
    }
}
