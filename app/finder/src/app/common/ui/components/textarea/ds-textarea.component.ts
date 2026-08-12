import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HlmTextarea } from '@spartan-ng/helm/textarea';

@Component({
  selector: 'ds-textarea',
  imports: [HlmTextarea],
  templateUrl: './ds-textarea.component.html',
  styleUrl: './ds-textarea.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsTextareaComponent), multi: true }],
  host: { style: 'display: block; width: 100%' },
})
export class DsTextareaComponent implements ControlValueAccessor {
  label      = input<string | undefined>(undefined);
  error      = input<string | undefined>(undefined);
  placeholder = input('');
  rows       = input(3);
  maxlength  = input<number | null>(null);
  autoResize = input(false);
  maxHeight  = input('200px');

  blurred = output<void>();

  protected readonly value      = signal('');
  protected readonly isDisabled = signal(false);

  private readonly elRef = viewChild<ElementRef<HTMLTextAreaElement>>('el');
  private minHeight = 40;
  private viewReady = false;

  private onChange: (v: string) => void = () => {};
  protected onTouched: () => void = () => {};

  constructor() {
    afterNextRender(() => {
      if (!this.autoResize()) return;
      const el = this.elRef()?.nativeElement;
      if (!el) return;
      this.viewReady = true;
      el.style.setProperty('field-sizing', 'fixed');
      el.style.minHeight = '0';
      this.minHeight = el.scrollHeight;
      this.resizeInstant(el);
    });
  }

  focus(): void { this.elRef()?.nativeElement.focus(); }

  protected onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.value.set(el.value);
    this.onChange(el.value);
    if (this.autoResize()) this.resizeAnimated(el);
  }

  protected onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }

  writeValue(val: string): void {
    this.value.set(val ?? '');
    if (this.viewReady && this.autoResize()) {
      const el = this.elRef()?.nativeElement;
      if (!el) return;
      el.value = val ?? '';
      this.resizeInstant(el);
    }
  }

  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled.set(d); }

  private resizeInstant(el: HTMLTextAreaElement): void {
    el.style.transition = 'none';
    el.style.height = `${this.minHeight}px`;
    const target = Math.max(el.scrollHeight, this.minHeight);
    el.style.height = `${target}px`;
    el.classList.toggle('scrollable', this.exceedsMax(target));
    void el.offsetHeight;
    el.style.transition = '';
  }

  private resizeAnimated(el: HTMLTextAreaElement): void {
    const from = el.offsetHeight;
    el.style.transition = 'none';
    el.style.height = `${this.minHeight}px`;
    const target = Math.max(el.scrollHeight, this.minHeight);
    el.style.height = `${from}px`;
    void el.offsetHeight;
    el.style.transition = '';
    el.style.height = `${target}px`;
    el.classList.toggle('scrollable', this.exceedsMax(target));
  }

  private exceedsMax(h: number): boolean {
    const max = parseFloat(this.maxHeight());
    return !isNaN(max) && h >= max;
  }
}
