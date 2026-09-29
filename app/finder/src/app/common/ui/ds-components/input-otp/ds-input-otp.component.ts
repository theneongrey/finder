import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    afterRenderEffect,
    computed,
    forwardRef,
    inject,
    input,
    signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BrnInputOtp } from '@spartan-ng/brain/input-otp';
import { HlmInputOtpImports } from '@spartan-ng/helm/input-otp';

@Component({
    selector: 'ds-input-otp',
    imports: [BrnInputOtp, ...HlmInputOtpImports],
    templateUrl: './ds-input-otp.component.html',
    styleUrl: './ds-input-otp.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DsInputOtpComponent),
            multi: true,
        },
    ],
    host: {
        style: 'display: block; cursor: text',
        '[class.ds-otp--invalid]': 'invalid()',
        '(click)': 'focus()',
    },
})
export class DsInputOtpComponent implements ControlValueAccessor {
    length = input(6);
    groupSize = input(3);
    /** Marks every slot with a red border, e.g. after a rejected code. */
    invalid = input(false);

    protected readonly value = signal('');
    protected readonly isDisabled = signal(false);

    protected readonly groups = computed(() => {
        const len = this.length();
        const gs = this.groupSize();
        const out: number[][] = [];
        for (let i = 0; i < len; i += gs) {
            out.push(
                Array.from({ length: Math.min(gs, len - i) }, (_, j) => i + j),
            );
        }
        return out;
    });

    private readonly el = inject(ElementRef);

    constructor() {
        // aria-invalid belongs on the focusable input (rendered by BrnInputOtp), not on the
        // host, so screen readers report it.
        afterRenderEffect(() => {
            const input = this.el.nativeElement.querySelector(
                'brn-input-otp input',
            ) as HTMLInputElement | null;
            if (this.invalid()) {
                input?.setAttribute('aria-invalid', 'true');
            } else {
                input?.removeAttribute('aria-invalid');
            }
        });
    }

    private onChange: (v: string) => void = () => {
        /* do nothing */
    };
    protected onTouched: () => void = () => {
        /* do nothing */
    };

    protected onValueChange(v: string | null): void {
        const val = v ?? '';
        this.value.set(val);
        this.onChange(val);
    }

    focus(): void {
        (
            this.el.nativeElement.querySelector(
                'brn-input-otp input',
            ) as HTMLElement | null
        )?.focus();
    }

    writeValue(val: string): void {
        this.value.set(val ?? '');
    }
    registerOnChange(fn: (v: string) => void): void {
        this.onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
    setDisabledState(d: boolean): void {
        this.isDisabled.set(d);
    }
}
