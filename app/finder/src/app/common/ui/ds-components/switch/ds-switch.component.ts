import {
    ChangeDetectionStrategy,
    Component,
    computed,
    forwardRef,
    input,
    model,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HlmSwitch } from '@spartan-ng/helm/switch';

export type SwitchSize = 'sm' | 'md';

@Component({
    selector: 'ds-switch',
    imports: [HlmSwitch],
    templateUrl: './ds-switch.component.html',
    styleUrl: './ds-switch.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DsSwitchComponent),
            multi: true,
        },
    ],
    // No host (click) toggle: hlm-switch already handles click + keyboard and reports via
    // checkedChange; toggling here as well flipped the value twice per click.
    host: {
        style: 'display: inline-block; cursor: pointer',
    },
})
export class DsSwitchComponent implements ControlValueAccessor {
    size = input<SwitchSize>('md');
    checked = model<boolean>(false);
    /** Accessible name for the switch, forwarded to hlm-switch's aria-label. */
    label = input<string | undefined>(undefined);

    protected readonly hlmSize = computed(() =>
        this.size() === 'sm' ? ('sm' as const) : ('default' as const),
    );

    isDisabled = false;

    private onChange: (v: boolean) => void = () => {
        /* do nothing */
    };
    private onTouched: () => void = () => {
        /* do nothing */
    };

    protected onCheckedChange(v: boolean): void {
        this.checked.set(v);
        this.onChange(v);
        this.onTouched();
    }

    writeValue(val: boolean): void {
        this.checked.set(!!val);
    }
    registerOnChange(fn: (v: boolean) => void): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
    setDisabledState(d: boolean): void {
        this.isDisabled = d;
    }
}
