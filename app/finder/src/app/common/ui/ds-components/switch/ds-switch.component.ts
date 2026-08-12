import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HlmSwitch } from '@spartan-ng/helm/switch';

export type SwitchSize = 'sm' | 'md';

@Component({
  selector: 'ds-switch',
  imports: [HlmSwitch],
  templateUrl: './ds-switch.component.html',
  styleUrl: './ds-switch.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsSwitchComponent), multi: true }],
  host: { style: 'display: inline-block; cursor: pointer', '(click)': 'toggle()' },
})
export class DsSwitchComponent implements ControlValueAccessor {
  size    = input<SwitchSize>('md');
  checked = model<boolean>(false);

  protected readonly hlmSize = computed(() => this.size() === 'sm' ? 'sm' as const : 'default' as const);

  isDisabled = false;

  private onChange: (v: boolean) => void = () => { /* do nothing */ };
  private onTouched: () => void = () => { /* do nothing */ };

  toggle(): void {
    if (this.isDisabled) { return; }
    const next = !this.checked();
    this.checked.set(next);
    this.onChange(next);
    this.onTouched();
  }

  protected onCheckedChange(v: boolean): void {
    this.checked.set(v);
    this.onChange(v);
  }

  writeValue(val: boolean): void { this.checked.set(!!val); }
  registerOnChange(fn: (v: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled = d; }
}
