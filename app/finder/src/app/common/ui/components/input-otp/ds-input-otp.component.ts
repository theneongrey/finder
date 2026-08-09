import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ds-input-otp',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsInputOtpComponent), multi: true }],
  host: { style: 'display: inline-block; cursor: text', '(click)': 'focus()' },
  template: `
    <div class="otp-root">
      <input
        #hiddenInput
        class="otp-hidden"
        inputmode="numeric"
        autocomplete="one-time-code"
        [attr.maxlength]="length()"
        [value]="value()"
        [disabled]="isDisabled()"
        (input)="onInput($event)"
        (focus)="focused.set(true)"
        (blur)="focused.set(false); onTouched()"
      />
      @for (group of groups(); track $index; let gi = $index) {
        @if (gi > 0) { <span class="otp-sep">—</span> }
        <div class="otp-group">
          @for (i of group; track i) {
            <div class="otp-slot"
              [class.otp-slot--active]="focused() && activeIdx() === i"
              [class.otp-slot--filled]="i < value().length">
              {{ value()[i] || '' }}
              @if (focused() && activeIdx() === i) {
                <span class="otp-cursor"></span>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .otp-root {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      position: relative;
    }
    .otp-hidden {
      position: absolute;
      opacity: 0;
      width: 1px;
      height: 1px;
      pointer-events: none;
    }
    .otp-group { display: flex; gap: 6px; }
    .otp-slot {
      width: 42px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--border-hairline-strong);
      background: var(--bg-input);
      font-size: var(--fs-display-xs);
      font-family: var(--font-display);
      font-weight: 700;
      color: var(--text-primary);
      position: relative;
      transition: border-color var(--duration-fast) var(--ease-standard);
    }
    .otp-slot--active { border-color: var(--accent); }
    .otp-slot--filled { background: var(--accent-tint); }
    .otp-sep {
      color: var(--text-muted);
      font-size: var(--fs-body);
      padding: 0 2px;
    }
    @keyframes ds-otp-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    .otp-cursor {
      position: absolute;
      width: 2px;
      height: 22px;
      background: var(--accent);
      border-radius: 1px;
      animation: ds-otp-blink 1s ease-in-out infinite;
    }
  `],
})
export class DsInputOtpComponent implements ControlValueAccessor {
  length    = input(6);
  groupSize = input(3);

  protected readonly value      = signal('');
  protected readonly isDisabled = signal(false);
  protected readonly focused    = signal(false);

  protected readonly groups = computed(() => {
    const len = this.length();
    const gs  = this.groupSize();
    const out: number[][] = [];
    for (let i = 0; i < len; i += gs) {
      out.push(Array.from({ length: Math.min(gs, len - i) }, (_, j) => i + j));
    }
    return out;
  });

  protected readonly activeIdx = computed(() =>
    Math.min(this.value().length, this.length() - 1)
  );

  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('hiddenInput');

  private onChange: (v: string) => void = () => {};
  protected onTouched: () => void = () => {};

  focus(): void { this.inputEl().nativeElement.focus(); }

  protected onInput(event: Event): void {
    const filtered = (event.target as HTMLInputElement).value
      .replace(/\D/g, '')
      .slice(0, this.length());
    this.value.set(filtered);
    this.onChange(filtered);
  }

  writeValue(val: string): void { this.value.set(val ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled.set(d); }
}
