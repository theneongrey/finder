import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type SwitchSize = 'sm' | 'md';

const SIZES: Record<SwitchSize, { trackW: number; trackH: number; knobSize: number; knobOff: number; knobOn: number }> = {
  sm: { trackW: 32, trackH: 19, knobSize: 14, knobOff: 2.5, knobOn: 15.5 },
  md: { trackW: 38, trackH: 22, knobSize: 18, knobOff: 2,   knobOn: 18   },
};

@Component({
  selector: 'ds-switch',
  templateUrl: './ds-switch.component.html',
  styleUrl: './ds-switch.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsSwitchComponent), multi: true }],
  host: { style: 'display: inline-block; cursor: pointer', '(click)': 'toggle()' },
})
export class DsSwitchComponent implements ControlValueAccessor {
  size    = input<SwitchSize>('md');
  checked = model<boolean>(false);

  protected readonly dim = computed(() => SIZES[this.size()] ?? SIZES['md']);

  private onChange: (v: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    if (this.isDisabled) return;
    const next = !this.checked();
    this.checked.set(next);
    this.onChange(next);
    this.onTouched();
  }

  private isDisabled = false;

  writeValue(val: boolean): void { this.checked.set(!!val); }
  registerOnChange(fn: (v: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled = d; }
}
