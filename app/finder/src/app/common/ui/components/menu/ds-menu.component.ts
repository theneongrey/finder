import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DsIconComponent } from '../icon/ds-icon.component';

export interface MenuItem {
  icon: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

@Component({
  selector: 'ds-menu',
  imports: [DsIconComponent],
  template: `
    @if (open()) {
      <div class="ds-menu-scrim" (click)="closed.emit()"></div>
      <div class="ds-menu-panel">
        @for (item of items(); track item.label) {
          <button
            type="button"
            [style.color]="item.danger ? 'var(--negative)' : 'var(--ink-700)'"
            class="ds-menu-item"
            (click)="item.onClick(); closed.emit()"
          >
            <ds-icon [name]="item.icon" [size]="15" />
            {{ item.label }}
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .ds-menu-scrim {
      position: fixed;
      inset: 0;
      z-index: var(--z-dropdown);
    }
    .ds-menu-panel {
      position: absolute;
      top: 48px;
      right: 0;
      background: #fff;
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-overlay);
      padding: 6px;
      min-width: 160px;
      z-index: calc(var(--z-dropdown) + 1);
    }
    .ds-menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      border: none;
      background: none;
      font-family: var(--font-body);
      font-size: var(--fs-ui);
      font-weight: var(--weight-semibold);
      padding: 9px 10px;
      border-radius: var(--radius-xs);
      cursor: pointer;
      text-align: left;
      transition: background var(--duration-fast) var(--ease-standard);
    }
    .ds-menu-item:hover { background: var(--sand-100); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'position: relative; display: contents;' },
})
export class DsMenuComponent {
  open = input.required<boolean>();
  items = input.required<MenuItem[]>();

  closed = output<void>();
}
