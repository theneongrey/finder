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

@Component({
  selector: 'ds-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsTextareaComponent), multi: true }],
  host: { style: 'display: block; width: 100%' },
  template: `
    <div class="ds-ta-wrap">
      @if (label()) {
        <label class="ds-ta-label">{{ label() }}</label>
      }
      <textarea
        #el
        class="ds-ta"
        [class.ds-ta--error]="!!error()"
        [placeholder]="placeholder()"
        [rows]="autoResize() ? 1 : rows()"
        [attr.maxlength]="maxlength() ?? null"
        [value]="value()"
        [disabled]="isDisabled()"
        (input)="onInput($event)"
        (blur)="onBlur()"
      ></textarea>
      @if (error()) {
        <span class="ds-ta-error">{{ error() }}</span>
      }
    </div>
  `,
  styles: [`
    .ds-ta-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }
    .ds-ta-label {
      font-family: var(--font-body);
      font-size: var(--fs-ui-sm);
      font-weight: var(--weight-semibold);
      color: var(--text-secondary);
    }
    .ds-ta {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--border-hairline-strong);
      border-radius: var(--radius-sm);
      padding: 11px 14px;
      font-size: var(--fs-body-xs);
      font-family: var(--font-body);
      color: var(--text-primary);
      background: var(--bg-input);
      outline: none;
      resize: vertical;
      transition:
        border-color var(--duration-fast) var(--ease-standard),
        height 200ms ease-out;
      scrollbar-width: none;
    }
    .ds-ta::-webkit-scrollbar { display: none; }
    .ds-ta.scrollable { scrollbar-width: auto; }
    .ds-ta.scrollable::-webkit-scrollbar { display: block; }
    .ds-ta:focus { border-color: var(--accent); }
    .ds-ta--error { border-color: var(--negative); }
    .ds-ta:disabled { opacity: 0.5; cursor: default; }
    .ds-ta-error {
      font-size: var(--fs-caption-sm);
      color: var(--negative);
    }
  `],
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
