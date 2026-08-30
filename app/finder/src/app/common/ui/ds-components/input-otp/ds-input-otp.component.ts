import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
  host: { style: 'display: block; cursor: text', '(click)': 'focus()' },
})
export class DsInputOtpComponent implements ControlValueAccessor {
  length = input(6);
  groupSize = input(3);

  protected readonly value = signal('');
  protected readonly isDisabled = signal(false);

  protected readonly groups = computed(() => {
    const len = this.length();
    const gs = this.groupSize();
    const out: number[][] = [];
    for (let i = 0; i < len; i += gs) {
      out.push(Array.from({ length: Math.min(gs, len - i) }, (_, j) => i + j));
    }
    return out;
  });

  private readonly el = inject(ElementRef);

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
