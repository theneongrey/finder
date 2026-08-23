import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HlmInput } from '@spartan-ng/helm/input';

@Component({
  selector: 'ds-input',
  imports: [HlmInput],
  templateUrl: './ds-input.component.html',
  styleUrl: './ds-input.component.css',
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
  type = input<'text' | 'email' | 'date' | 'time' | 'datetime-local'>('text');
  title = input<string | undefined>(undefined);
  background = input<string>('var(--bg-input)');
  label = input<string | undefined>(undefined);
  error = input<string | undefined>(undefined);
  placeholder = input<string>('');
  maxlength = input<number | null>(null);
  readonly = input(false);
  loading = input(false);

  readonly inputBlur = output<void>();

  protected readonly value = signal('');
  protected readonly isDisabled = signal(false);

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  private onChange: (value: string) => void = () => { /* do nothing */ };
  private onTouched: () => void = () => { /* do nothing */ };

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

  focus(): void {
    this.inputEl()?.nativeElement.focus();
  }

  protected handleInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  protected handleBlur(): void {
    this.onTouched();
    this.inputBlur.emit();
  }
}
