import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    model,
    signal,
} from '@angular/core';
import type { BrnOverlayState } from '@spartan-ng/brain/overlay';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { DsButtonComponent } from '../button/ds-button.component';
import { DsIconComponent } from '../icon/ds-icon.component';
import {
    DsTimeWheelComponent,
    TIME_WHEEL_ITEM_HEIGHT,
} from './ds-time-wheel.component';

/**
 * Time picker in the ds-* style: a field-like trigger showing `HH:MM` that opens a
 * popover with scroll wheels for hour and minute. The wheels edit a draft; Save
 * commits it, Cancel (or closing the popover) discards it. Wraps Spartan's popover.
 *
 * - `[(value)]` — `HH:MM` (24h) or undefined.
 * - `stepMinutes` — minute granularity (default 15 → 00 15 30 45).
 * - `title` / `cancelLabel` / `saveLabel` / `ariaLabel` — translated by the caller.
 */
@Component({
    selector: 'ds-time-picker',
    imports: [
        HlmPopoverImports,
        DsButtonComponent,
        DsIconComponent,
        DsTimeWheelComponent,
    ],
    templateUrl: './ds-time-picker.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'inline-block' },
})
export class DsTimePickerComponent {
    value = model<string | undefined>(undefined);
    stepMinutes = input(15);
    placeholder = input('--:--');
    title = input('');
    cancelLabel = input.required<string>();
    saveLabel = input.required<string>();
    /** Accessible name of the trigger, e.g. "Time" — announced together with the value. */
    ariaLabel = input<string | undefined>(undefined);

    protected readonly bandHeight = TIME_WHEEL_ITEM_HEIGHT;
    protected readonly triggerLabel = computed(() => {
        const label = this.ariaLabel();
        if (!label) {
            return null;
        }
        return this.value() ? `${label}: ${this.value()}` : label;
    });

    protected readonly hours = Array.from({ length: 24 }, (_, h) => pad(h));
    protected readonly minutes = computed(() => {
        const step = Math.max(1, this.stepMinutes());
        return Array.from({ length: Math.ceil(60 / step) }, (_, i) =>
            pad(i * step),
        );
    });

    protected readonly draftHour = signal('12');
    protected readonly draftMinute = signal('00');
    protected readonly popoverState = signal<BrnOverlayState | null>(null);

    protected onStateChanged(state: BrnOverlayState): void {
        if (state === 'open') {
            const [hour, minute] = (this.value() ?? '12:00').split(':');
            this.draftHour.set(hour);
            this.draftMinute.set(this.snapMinute(minute));
        }
        this.popoverState.set(state);
    }

    protected save(): void {
        this.value.set(`${this.draftHour()}:${this.draftMinute()}`);
        this.popoverState.set('closed');
    }

    protected cancel(): void {
        this.popoverState.set('closed');
    }

    /** Round an off-grid minute (e.g. 10:10 from an old option) to the nearest step. */
    private snapMinute(minute: string): string {
        const minutes = this.minutes();
        const target = Number(minute);
        return minutes.reduce((best, m) =>
            Math.abs(Number(m) - target) < Math.abs(Number(best) - target)
                ? m
                : best,
        );
    }
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}
