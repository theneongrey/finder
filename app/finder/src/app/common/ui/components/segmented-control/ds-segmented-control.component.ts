import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface SegmentOption {
  value: string;
  label: string;
}

@Component({
  selector: 'ds-segmented-control',
  template: `
    <div class="ds-seg-track">
      @for (opt of options(); track opt.value) {
        <button
          type="button"
          [class.ds-seg-btn--active]="opt.value === value()"
          [style.padding]="size() === 'sm' ? '8px 4px' : '9px 8px'"
          [style.font-size]="size() === 'sm' ? 'var(--fs-caption)' : 'var(--fs-ui-sm)'"
          class="ds-seg-btn"
          (click)="value.set(opt.value)"
        >{{ opt.label }}</button>
      }
    </div>
  `,
  styles: [`
    .ds-seg-track {
      display: flex;
      gap: 6px;
      background: var(--cream-300);
      padding: 4px;
      border-radius: var(--radius-md);
    }
    .ds-seg-btn {
      flex: 1;
      border: none;
      border-radius: var(--radius-xs);
      font-family: var(--font-body);
      font-weight: var(--weight-semibold);
      cursor: pointer;
      background: transparent;
      color: var(--text-tertiary);
      box-shadow: none;
      transition: background var(--duration-fast) var(--ease-standard),
                  color var(--duration-fast) var(--ease-standard),
                  box-shadow var(--duration-fast) var(--ease-standard);
    }
    .ds-seg-btn--active {
      font-weight: var(--weight-bold);
      background: #fff;
      color: var(--text-primary);
      box-shadow: 0 1px 4px rgba(20, 24, 28, 0.1);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block;' },
})
export class DsSegmentedControlComponent {
  options = input.required<SegmentOption[]>();
  value = model.required<string>();
  size = input<'sm' | 'md'>('md');
}
