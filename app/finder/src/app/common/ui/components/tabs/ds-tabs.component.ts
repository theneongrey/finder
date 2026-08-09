import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'ds-tabs',
  template: `
    <div class="ds-tabs">
      @for (item of items(); track item.value) {
        <button
          type="button"
          [class.ds-tab--active]="item.value === value()"
          [style.font-size]="size() === 'sm' ? 'var(--fs-body-sm)' : 'var(--fs-body)'"
          class="ds-tab"
          (click)="value.set(item.value)"
        >
          {{ item.label }}
          @if (item.count != null) {
            <span
              class="ds-tab-count"
              [class.ds-tab-count--active]="item.value === value()"
            >{{ item.count }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: [`
    .ds-tabs {
      display: flex;
      gap: 24px;
      border-bottom: 1px solid var(--border-hairline);
    }
    .ds-tab {
      border: none;
      background: none;
      font-family: var(--font-body);
      font-weight: var(--weight-semibold);
      cursor: pointer;
      color: var(--text-muted);
      padding: 0 0 12px;
      margin-bottom: -1px;
      border-bottom: 2.5px solid transparent;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: color var(--duration-fast) var(--ease-standard),
                  border-color var(--duration-fast) var(--ease-standard);
    }
    .ds-tab--active {
      font-weight: var(--weight-bold);
      color: var(--text-primary);
      border-bottom-color: var(--accent);
    }
    .ds-tab-count {
      font-size: var(--fs-caption-sm);
      font-weight: var(--weight-bold);
      background: var(--cream-300);
      color: var(--text-muted);
      padding: 1px 7px;
      border-radius: 10px;
    }
    .ds-tab-count--active {
      background: var(--accent-tint);
      color: var(--accent);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block;' },
})
export class DsTabsComponent {
  items = input.required<TabItem[]>();
  value = model.required<string>();
  size = input<'sm' | 'md'>('md');
}
