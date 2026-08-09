import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ds-input',
  template: `
    <div class="ds-input-wrap">
      @if (label()) {
        <label class="ds-input-label">{{ label() }}</label>
      }
      <input
        [type]="type()"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [style.background]="background()"
        [class.ds-input--error]="!!error()"
        class="ds-input"
        (input)="handleInput($event)"
        (blur)="handleBlur()"
      />
      @if (error()) {
        <span class="ds-input-error">{{ error() }}</span>
      }
    </div>
  `,
  styles: [`
    .ds-input-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }
    .ds-input-label {
      font-family: var(--font-body);
      font-size: var(--fs-ui-sm);
      font-weight: var(--weight-semibold);
      color: var(--text-secondary);
    }
    .ds-input {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--border-hairline-strong);
      border-radius: var(--radius-sm);
      padding: 11px 14px;
      font-size: var(--fs-body-xs);
      font-family: var(--font-body);
      color: var(--text-primary);
      outline: none;
      transition: border-color var(--duration-fast) var(--ease-standard);
    }
    .ds-input:focus { border-color: var(--accent); }
    .ds-input--error { border-color: var(--negative); }
    .ds-input:disabled { opacity: 0.5; cursor: default; }
    .ds-input-error {
      font-size: var(--fs-caption-sm);
      color: var(--negative);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsInputComponent),
      multi: true,
    },
  ],
})
export class DsInputComponent implements ControlValueAccessor {
  type = input<'text' | 'date' | 'time'>('text');
  background = input<string>('var(--bg-input)');
  label = input<string | undefined>(undefined);
  error = input<string | undefined>(undefined);
  placeholder = input<string>('');

  protected readonly value = signal('');
  protected readonly isDisabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected handleInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
