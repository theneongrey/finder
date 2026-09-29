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
import { DsIconComponent } from '../icon/ds-icon.component';

/**
 * Time picker in the ds-* style: a field-like trigger showing `HH:MM` that opens a
 * popover with an hour grid and the minute steps. Wraps Spartan's popover.
 *
 * - `[(value)]` — `HH:MM` (24h) or undefined.
 * - `stepMinutes` — minute granularity (default 15 → :00 :15 :30 :45).
 */
@Component({
    selector: 'ds-time-picker',
    imports: [HlmPopoverImports, DsIconComponent],
    templateUrl: './ds-time-picker.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'inline-block' },
})
export class DsTimePickerComponent {
    value = model<string | undefined>(undefined);
    stepMinutes = input(15);
    placeholder = input('--:--');

    protected readonly hours = Array.from({ length: 24 }, (_, h) => pad(h));
    protected readonly minutes = computed(() => {
        const step = Math.max(1, this.stepMinutes());
        return Array.from({ length: Math.ceil(60 / step) }, (_, i) =>
            pad(i * step),
        );
    });

    protected readonly hour = computed(() => this.value()?.split(':')[0]);
    protected readonly minute = computed(() => this.value()?.split(':')[1]);

    protected readonly popoverState = signal<BrnOverlayState | null>(null);

    protected selectHour(hour: string): void {
        this.value.set(`${hour}:${this.snapMinute(this.minute())}`);
    }

    protected selectMinute(minute: string): void {
        this.value.set(`${this.hour() ?? '00'}:${minute}`);
        this.popoverState.set('closed');
    }

    /** Keep the current minute when it's on the grid, else fall back to :00. */
    private snapMinute(minute: string | undefined): string {
        return minute && this.minutes().includes(minute) ? minute : '00';
    }
}

function pad(n: number): string {
    return String(n).padStart(2, '0');
}
