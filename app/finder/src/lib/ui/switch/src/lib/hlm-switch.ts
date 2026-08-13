import { BrnSwitch, BrnSwitchThumb } from '@spartan-ng/brain/switch';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { classes, hlm } from '@spartan-ng/helm/utils';
import { type BooleanInput } from '@angular/cdk/coercion';
import { type ChangeFn, type TouchFn } from '@spartan-ng/brain/forms';
import { type ClassValue } from 'clsx';

@Directive({
  selector: 'brn-switch-thumb[hlm],[hlmSwitchThumb]',
  host: { 'data-slot': 'switch-thumb' },
})
export class HlmSwitchThumb {
  constructor() {
    classes(
      () =>
        'bg-background dark:data-unchecked:bg-foreground dark:data-checked:bg-primary-foreground rounded-full group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-unchecked:translate-x-0 data-checked:ltr:translate-x-[calc(100%-2px)] data-checked:rtl:-translate-x-[calc(100%-2px)] pointer-events-none block ring-0 transition-transform',
    );
  }
}

export const HLM_SWITCH_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => HlmSwitch),
  multi: true,
};

@Component({
  selector: 'hlm-switch',
  imports: [BrnSwitchThumb, BrnSwitch, HlmSwitchThumb],
  providers: [HLM_SWITCH_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'switch',
    class: 'contents',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
  },
  template: `
    <brn-switch
      [class]="_computedClass()"
      [size]="size()"
      [checked]="checked()"
      (checkedChange)="handleChange($event)"
      (touched)="_onTouched?.()"
      [disabled]="_disabled()"
      [id]="inputId()"
      [aria-label]="ariaLabel()"
      [aria-labelledby]="ariaLabelledby()"
      [aria-describedby]="ariaDescribedby()"
    >
      <brn-switch-thumb hlm />
    </brn-switch>
  `,
})
export class HlmSwitch implements ControlValueAccessor {
  public readonly userClass = input<ClassValue>('', { alias: 'class' });
  protected readonly _computedClass = computed(() =>
    hlm(
      'data-checked:bg-primary data-unchecked:bg-input focus-visible:border-ring focus-visible:ring-ring/50 rounded-full border border-transparent focus-visible:ring-3 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] group/switch inline-flex shrink-0 items-center transition-all outline-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50',
      this.userClass(),
    ),
  );

  public readonly checkedInput = input<boolean, BooleanInput>(false, {
    alias: 'checked',
    transform: booleanAttribute,
  });
  public readonly checked = linkedSignal(this.checkedInput);
  public readonly checkedChange = output<boolean>();

  public readonly disabled = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
  });
  public readonly size = input<'default' | 'sm'>('default');
  public readonly inputId = input<string | null>(null);
  public readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  public readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });
  public readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });

  protected readonly _disabled = linkedSignal(this.disabled);
  protected _onChange?: ChangeFn<boolean>;
  protected _onTouched?: TouchFn;

  protected handleChange(value: boolean): void {
    this.checked.set(value);
    this._onChange?.(value);
    this.checkedChange.emit(value);
  }

  writeValue(value: boolean): void { this.checked.set(Boolean(value)); }
  registerOnChange(fn: ChangeFn<boolean>): void { this._onChange = fn; }
  registerOnTouched(fn: TouchFn): void { this._onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this._disabled.set(isDisabled); }
}

export const HlmSwitchImports = [HlmSwitch, HlmSwitchThumb] as const;
