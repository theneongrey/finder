import {
  afterNextRender,
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

@Component({
  selector: 'app-auto-resize-textarea',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutoResizeTextareaComponent),
      multi: true,
    },
  ],
  templateUrl: './auto-resize-textarea.component.html',
  styleUrl: './auto-resize-textarea.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoResizeTextareaComponent implements ControlValueAccessor {
  private readonly textareaRef =
    viewChild<ElementRef<HTMLTextAreaElement>>('textarea');

  placeholder = input('');
  maxlength = input<number | null>(null);
  inputId = input<string | null>(null);
  maxHeight = input<string>('200px');
  blurred = output<void>();

  protected readonly textValue = signal('');
  protected readonly isDisabled = signal(false);

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  focus(): void {
    this.textareaRef()?.nativeElement.focus();
  }

  protected onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }

  private minHeight = 40;
  private viewReady = false;

  constructor() {
    afterNextRender(() => {
      const el = this.textareaRef()?.nativeElement;
      if (!el) {
        return;
      }
      this.viewReady = true;
      el.style.setProperty('field-sizing', 'fixed');
      el.style.minHeight = '0';
      this.minHeight = el.scrollHeight;
      this.resizeInstant(el);
    });
  }

  writeValue(value: string): void {
    this.textValue.set(value ?? '');
    if (this.viewReady) {
      const el = this.textareaRef()?.nativeElement;
      if (!el) {
        return;
      }
      el.value = value ?? '';
      this.resizeInstant(el);
    }
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

  protected onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.textValue.set(el.value);
    this.onChange(el.value);
    this.resizeAnimated(el);
  }

  private resizeInstant(el: HTMLTextAreaElement): void {
    el.style.transition = 'none';
    el.style.height = `${this.minHeight}px`;
    const targetHeight = Math.max(el.scrollHeight, this.minHeight);
    el.style.height = `${targetHeight}px`;
    el.classList.toggle('scrollable', this.exceedsMaxHeight(targetHeight));
    void el.offsetHeight;
    el.style.transition = '';
  }

  private resizeAnimated(el: HTMLTextAreaElement): void {
    const fromHeight = el.offsetHeight;
    el.style.transition = 'none';
    el.style.height = `${this.minHeight}px`;
    const targetHeight = Math.max(el.scrollHeight, this.minHeight);
    el.style.height = `${fromHeight}px`;
    void el.offsetHeight;
    el.style.transition = '';
    el.style.height = `${targetHeight}px`;
    el.classList.toggle('scrollable', this.exceedsMaxHeight(targetHeight));
  }

  private exceedsMaxHeight(targetHeight: number): boolean {
    const maxPx = parseFloat(this.maxHeight());
    return !isNaN(maxPx) && targetHeight >= maxPx;
  }
}
