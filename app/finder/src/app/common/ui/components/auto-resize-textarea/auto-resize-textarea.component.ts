import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Textarea } from 'primeng/textarea';

@Component({
  selector: 'app-auto-resize-textarea',
  imports: [Textarea],
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

  protected readonly textValue = signal('');
  protected readonly isDisabled = signal(false);

  private onChange: (value: string) => void = () => {
    /* do nothing */
  };
  protected onTouched: () => void = () => {
    /* do nothing */
  };

  private minHeight = 40;
  private viewReady = false;

  constructor() {
    afterNextRender(() => {
      const el = this.textareaRef()?.nativeElement;
      if (!el) {
        return;
      }
      this.viewReady = true;
      this.minHeight = el.offsetHeight;
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
    el.style.height = `${Math.max(el.scrollHeight, this.minHeight)}px`;
    el.offsetHeight; // flush transition:none before re-enabling
    el.style.transition = '';
  }

  private resizeAnimated(el: HTMLTextAreaElement): void {
    const fromHeight = el.offsetHeight;

    // Collapse without transition to measure true content height, then restore.
    // No reflow between the two height assignments, so the browser never paints
    // the collapsed state.
    el.style.transition = 'none';
    el.style.height = `${this.minHeight}px`;
    const targetHeight = Math.max(el.scrollHeight, this.minHeight);
    el.style.height = `${fromHeight}px`;

    // Flush so the browser commits fromHeight as the animation origin.
    el.offsetHeight;

    el.style.transition = '';
    el.style.height = `${targetHeight}px`;
  }
}
