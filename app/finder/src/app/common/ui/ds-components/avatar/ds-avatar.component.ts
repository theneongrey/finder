import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ElementRef,
    computed,
    inject,
    input,
    signal,
    viewChild,
} from '@angular/core';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { DsIconComponent } from '../icon/ds-icon.component';

const SIZE_MAP = { sm: 27, md: 34, lg: 38 } as const;
type AvatarSize = keyof typeof SIZE_MAP;

// How long the tooltip stays up after a click/tap (hover dismiss is near-instant).
const TOOLTIP_CLICK_VISIBLE_MS = 2500;
// Gap between the avatar and the tooltip, and the tooltip's rough height used for flip detection.
const TOOLTIP_GAP = 7;
const TOOLTIP_APPROX_HEIGHT = 30;

@Component({
    selector: 'ds-avatar',
    imports: [...HlmAvatarImports, DsIconComponent],
    templateUrl: './ds-avatar.component.html',
    styleUrl: './ds-avatar.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { style: 'display: contents' },
})
export class DsAvatarComponent {
    initial = input.required<string>();
    bg = input<string>('var(--person-1-bg)');
    fg = input<string>('var(--person-1-fg)');
    size = input<AvatarSize | number>('md');
    /** undefined = no voting context; true = voted (ring + check badge); false = pending (dashed border) */
    voted = input<boolean | undefined>(undefined);
    /** Optional tooltip label (e.g. the person's name). No tooltip when unset. */
    tooltip = input<string | undefined>(undefined);

    protected readonly px = computed(() => {
        const s = this.size();
        return typeof s === 'number' ? s : (SIZE_MAP[s] ?? SIZE_MAP['md']);
    });
    protected readonly fontSize = computed(() => Math.round(this.px() * 0.4));
    protected readonly isPending = computed(() => this.voted() === false);
    protected readonly borderClass = computed(() =>
        this.isPending()
            ? 'border-[1.5px] border-dashed border-[var(--sand-400)]'
            : 'border-[2.5px] border-solid border-[var(--white)]',
    );

    // `#circle` is on <hlm-avatar> (a component), so we must read the ElementRef explicitly —
    // the default viewChild would hand back the component instance, which has no nativeElement.
    private readonly circle = viewChild('circle', { read: ElementRef });

    // Lightweight tooltip: shows on hover and on click/tap. It is rendered with `position: fixed`
    // and positioned from the avatar's bounding rect so it escapes any clipping ancestor (e.g. a
    // card's `overflow: hidden`) and sits right against the avatar regardless of flex stretch.
    protected readonly tooltipOpen = signal(false);
    protected readonly tipTop = signal(0);
    protected readonly tipLeft = signal(0);
    protected readonly tipPlacement = signal<'below' | 'above'>('below');
    private hideTimer?: ReturnType<typeof setTimeout>;
    private minVisibleUntil = 0;

    constructor() {
        inject(DestroyRef).onDestroy(() => this.clearHideTimer());
    }

    protected onPointerEnter(): void {
        if (this.tooltip()) {
            this.show();
        }
    }

    protected onPointerLeave(): void {
        if (this.tooltip()) {
            this.scheduleHide(120);
        }
    }

    protected onClick(): void {
        if (this.tooltip()) {
            this.show(TOOLTIP_CLICK_VISIBLE_MS);
            this.scheduleHide(TOOLTIP_CLICK_VISIBLE_MS);
        }
    }

    private show(minVisibleMs = 0): void {
        this.clearHideTimer();
        this.positionTooltip();
        this.minVisibleUntil = Math.max(
            this.minVisibleUntil,
            Date.now() + minVisibleMs,
        );
        this.tooltipOpen.set(true);
    }

    /** Anchor the tooltip to the avatar circle, flipping above when there's no room below. */
    private positionTooltip(): void {
        const el = this.circle()?.nativeElement;
        if (!el) {
            return;
        }
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const roomBelow =
            window.innerHeight - rect.bottom >
            TOOLTIP_GAP + TOOLTIP_APPROX_HEIGHT;
        this.tipLeft.set(Math.round(centerX));
        if (roomBelow) {
            this.tipPlacement.set('below');
            this.tipTop.set(Math.round(rect.bottom + TOOLTIP_GAP));
        } else {
            this.tipPlacement.set('above');
            this.tipTop.set(Math.round(rect.top - TOOLTIP_GAP));
        }
    }

    private scheduleHide(delayMs: number): void {
        this.clearHideTimer();
        const remaining = Math.max(delayMs, this.minVisibleUntil - Date.now());
        this.hideTimer = setTimeout(() => {
            this.tooltipOpen.set(false);
            this.minVisibleUntil = 0;
            this.hideTimer = undefined;
        }, remaining);
    }

    private clearHideTimer(): void {
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = undefined;
        }
    }
}
